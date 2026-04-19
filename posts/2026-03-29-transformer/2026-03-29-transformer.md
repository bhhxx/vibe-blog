---
title: "一个 GPT-2 风格 Transformer 架构"
date: 2026-03-29
tags: ["LLM"]
description: "一个 GPT-2 风格 Transformer 架构"
---

# 一个 GPT-2 风格 Transformer 架构

## GPT-2 风格 124M 的总体架构

本文讨论的是 [gpt.py](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/gpt.py) 中实现的 **GPT-2-style decoder-only Transformer** 架构。这里的“GPT-2 风格”，主要指整体骨架和核心计算方式与 GPT-2 small 相近，例如自回归生成、带 causal mask 的 self-attention、可学习的位置嵌入，以及堆叠的 Transformer Block；它并不表示逐项复刻原始 GPT-2 的全部工程细节。

为了避免一开始就陷入实现细节，下面会按照数据在模型中的流动顺序来讲：先看文本如何变成向量，再看这些向量如何在 Transformer Block 中被更新，最后看模型如何输出 logits 并用于训练和生成。

**从数据流的角度看**，这个模型可以概括为下面几个步骤：

1. 输入文本先经过 tokenizer，转换为一串 token IDs
2. token IDs 经过 Token Embedding，得到每个 token 的向量表示
3. 再加上 Positional Embedding，使模型获得位置信息
4. 这些表示被送入多层 Transformer Block，反复进行上下文建模和特征变换
5. 经过最终的 LayerNorm 和线性输出层后，模型在每个位置上得到对下一个 token 的预测 logits

**注**：一个典型的 GPT-2 small 配置包括 12 个 Transformer Block、hidden size 768、12 个 attention heads，总参数量约为 124M。

<img
  src="/assets/gpt2-architecture.svg"
  alt="GPT-2 风格 124M Transformer 总体架构图"
  style="zoom: 50%;"
/>

## 分词器

分词器的作用是把原始字符串转换成可以处理的 token ID 序列，以作为后续 Token Embedding 的输入。

### 分词器代码说明

```python
import tiktoken
tokenizer = tiktoken.get_encoding("gpt2")
txt = "I love China"
token_ids = tokenizer.encode(txt)
print(token_ids) # 输出 [40, 1842, 2807]
txt2 = tokenizer.decode(token_ids)
print(txt2) # 输出 I love China
```

如果把这几个 ID 分别解码回去，会得到：

- `40 -> "I"`
- `1842 -> " love"`
- `2807 -> " China"`

**注**：后两个 token 都带有前导空格。这里分词并不是简单地“按单词切开”，而是会把空格等信息一起编码进 token 片段中。

### 分词器输入输出

- 分词器的输入为文本
- 分词器的输出为 $x = [x_1, x_2, ..., x_T] \in \mathbb{N}^T$，其中 $T$ 是序列长度，$x_t$ 表示第 $t$ 个位置上的 token ID。后续的 Token Embedding 会把这些离散 ID 映射为连续向量。

## Token Embedding

上一节分词器输出的 token IDs（例如 `"I love China" -> [40, 1842, 2807]`）只是词表中的离散索引。它们的数值大小不仅没有语义关系，也无法被神经网络直接处理。因此，我们需要通过 Token Embedding 将这些离散编号映射为连续、可学习的高维向量。

从数学和工程实现来看，Token Embedding 本质上就是一次查表（Lookup）操作。它内部维护着一个可学习的参数矩阵 $E \in \mathbb{R}^{V \times d}$（其中 $V$ 是词表大小，$d$ 是向量维度），矩阵的每一行即代表一个 token 的向量表示。

给定形状为 $B \times T$（Batch Size $\times$ 序列长度）的输入张量 $X_{\text{ids}} \in \mathbb{N}^{B \times T}$，Embedding 层会直接把每个 ID 当作索引，从矩阵 $E$ 中“抽”出对应的 $d$ 维向量，最终输出连续表示 $X_{\text{tok}} \in \mathbb{R}^{B \times T \times d}$，交由后续模块处理。

### Token Embedding 代码说明

```python
import tiktoken
import torch
import torch.nn as nn

torch.manual_seed(123)

tokenizer = tiktoken.get_encoding("gpt2")
txt = "I love China"
token_ids = tokenizer.encode(txt)
embedding = nn.Embedding(num_embeddings=50257, embedding_dim=768) # 随机初始化权重
input_ids = torch.tensor([token_ids], dtype=torch.long) # shape: (1, 3)
x_tok = embedding(input_ids)
print(x_tok.shape) # torch.Size([1, 3, 768]) 这里的 1 是 batch size, 3 是序列长度, 768 是 embedding 维度
print(x_tok[0, 0, :5]) # 只展示第一个 token 向量的前 5 个元素
```

### Token Embedding 输入输出

- Token Embedding 的输入是 token ID 张量 $X_{\text{ids}} \in \mathbb{N}^{B \times T}$
- Token Embedding 的输出是 token embeddings $X_{\text{tok}} \in \mathbb{R}^{B \times T \times d}$

## Positional Embedding

Transformer 的自注意力机制本身并不能区分同一组 token 以不同顺序出现的情况，所以模型需要显式地注入位置信息。GPT-2 风格模型采用的是可学习的位置嵌入（Positional Embedding）：为每一个位置分配一个可学习的向量，并将其加到对应位置的 token embedding 上。

具体而言，模型维护着一个位置矩阵 $P \in \mathbb{R}^{L \times d}$（$L$ 为最大上下文长度，$d$ 为隐藏维度）。对于长度为 $T$ 的输入序列，模型会取出前 $T$ 个位置向量，并通过广播与 batch 中每个样本的 Token Embedding 逐元素相加，从而得到融合了语义与位置信息的最终输入：$X = X_{\text{tok}} + X_{\text{pos}}$。

### Positional Embedding 代码说明

```python
import tiktoken
import torch
import torch.nn as nn

torch.manual_seed(123)

tokenizer = tiktoken.get_encoding("gpt2")
txt = "I love China"
token_ids = tokenizer.encode(txt)   # [40, 1842, 2807]
input_ids = torch.tensor([token_ids], dtype=torch.long)   # shape: (1, 3)

token_embedding = nn.Embedding(num_embeddings=50257, embedding_dim=768)
position_embedding = nn.Embedding(num_embeddings=1024, embedding_dim=768)

x_tok = token_embedding(input_ids)   # shape: (1, 3, 768)

seq_len = input_ids.size(1)
position_ids = torch.arange(seq_len, device=input_ids.device, dtype=torch.long)    # [0, 1, 2]
x_pos = position_embedding(position_ids)                  # shape: (3, 768)

x = x_tok + x_pos                                         # shape: (1, 3, 768)

print("input_ids.shape =", input_ids.shape)
print("x_tok.shape =", x_tok.shape)
print("x_pos.shape =", x_pos.shape)
print("x.shape =", x.shape)
```

### Positional Embedding 输入输出

- Positional Embedding 的输入是位置索引 $[0, 1, \dots, T-1]$
- Positional Embedding 的输出是位置向量 $X_{\text{pos}} \in \mathbb{R}^{T \times d}$
- 它会与 token embeddings 相加，得到最终输入表示 $X \in \mathbb{R}^{B \times T \times d}$

## LayerNorm

到这里，输入已经从离散的 token ID 变成了连续向量表示 $X \in \mathbb{R}^{B \times T \times d}$。接下来在进入注意力层和前馈网络之前，模型通常会先做一次 LayerNorm。之所以单独拿出来讲，是因为它会在每个 Transformer Block 中反复出现。

LayerNorm 的作用，是对每个位置上的隐藏向量分别做归一化，使其数值分布更稳定，从而有助于训练。计算过程如下：

- $\mu = \frac{1}{d} \sum_{i=1}^{d} x_i$，先计算均值
- $\sigma^2 = \frac{1}{d} \sum_{i=1}^{d} (x_i - \mu)^2$，再计算方差
- $\hat{x}_i = \frac{x_i - \mu}{\sqrt{\sigma^2 + \epsilon}}$，做标准化
- $y_i = \gamma_i \hat{x}_i + \beta_i$，最后做可学习的仿射变换

因此，LayerNorm 不会改变张量形状。它只是沿着最后一个隐藏维度调整数值分布，所以输入和输出都仍然是 $\mathbb{R}^{B \times T \times d}$。

### LayerNorm 代码实现

```python
import tiktoken
import torch
import torch.nn as nn

torch.manual_seed(123)

class LayerNorm(nn.Module):
    def __init__(self, hidden_size, eps=1e-5):
        super().__init__()
        self.eps = eps # eps 是为了防止分母为 0 的极小值
        self.gamma = nn.Parameter(torch.ones(hidden_size)) # gamma (缩放参数)，初始化全为 1
        self.beta = nn.Parameter(torch.zeros(hidden_size)) # beta (平移参数)，初始化全为 0

    def forward(self, x):
        # 假设 x 的形状是 (Batch_Size, Seq_Length, Hidden_Size) 
        mean = x.mean(dim=-1, keepdim=True) # 第一步：计算均值 (Mean)
        var = ((x - mean) ** 2).mean(dim=-1, keepdim=True) # 第二步：计算方差 (Variance)
        x_norm = (x - mean) / torch.sqrt(var + self.eps) # 第三步：标准化 (Normalization)
        out = self.gamma * x_norm + self.beta # 第四步：仿射变换 (Scale and Shift)
        return out

tokenizer = tiktoken.get_encoding("gpt2")
txt = "I love China"
token_ids = tokenizer.encode(txt)   # [40, 1842, 2807]
input_ids = torch.tensor([token_ids], dtype=torch.long)   # shape: (1, 3)

token_embedding = nn.Embedding(num_embeddings=50257, embedding_dim=768)
position_embedding = nn.Embedding(num_embeddings=1024, embedding_dim=768)

x_tok = token_embedding(input_ids)   # shape: (1, 3, 768)

seq_len = input_ids.size(1)
position_ids = torch.arange(seq_len, device=input_ids.device, dtype=torch.long)    # [0, 1, 2]
x_pos = position_embedding(position_ids)                  # shape: (3, 768)
x = x_tok + x_pos

layernorm = LayerNorm(768)
x = layernorm(x)
print("x.shape =", x.shape) # x.shape = torch.Size([1, 3, 768])
print("mean =", x.mean(dim=-1)) # 每个位置的均值接近 0
print("var =", x.var(dim=-1, unbiased=False)) # 每个位置的方差接近 1
```

### LayerNorm 输入输出

- LayerNorm 的输入是隐藏表示 $X \in \mathbb{R}^{B \times T \times d}$
- LayerNorm 对每个位置上的 $d$ 维向量分别做归一化
- LayerNorm 的输出仍然是隐藏表示 $Y \in \mathbb{R}^{B \times T \times d}$

**注**：在 GPT-2 风格的 Pre-LN 结构中，LayerNorm 通常会放在注意力层和前馈网络之前，因此它并不是模型最开始的一次性预处理，而是会在每个 Transformer Block 内重复出现。

## Masked Multi-Head Self-Attention

自注意力机制是 Transformer 最核心的模块之一。它的作用是：让序列中的每个位置在更新自己的表示时，都能够根据当前上下文中的其他位置动态聚合信息。

在 decoder-only 语言模型里，输入序列中的每个 token 都会先被映射成 Query（Q）、Key（K）和 Value（V）。当前位置会用自己的 Q 与上下文中各个位置的 K 计算相关性，得到注意力权重，再对这些位置的 V 做加权求和，从而形成新的表示。

这里的 Masked，指的是会加上 causal mask。它保证第 $i$ 个位置只能看到自己以及自己之前的 token，而不能看到未来位置，因此模型才能用于自回归生成。

这里的 Multi-Head，指的是模型会并行地在多个不同的表示子空间里重复这套注意力计算。每个 head 可以关注不同类型的关系，最后再把各头结果拼接起来并投影回原始隐藏维度。

如果把单个 attention head 写成公式，可以表示为：
$$
Q = XW_Q,\quad K = XW_K,\quad V = XW_V
$$
$$
\text{Attention}(X) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_h}} + M\right)V
$$
其中 $d_h$ 是单个 head 的维度，$M$ 是 causal mask：允许关注的位置取 0，被屏蔽的未来位置取 $-\infty$。多个 head 并行计算后再拼接、线性投影，就得到最终输出。

### Masked Multi-Head Self-Attention 代码说明

```python
import torch
import torch.nn as nn

class MultiHeadAttention(nn.Module):
    def __init__(self, d_in, d_out, context_length, dropout, num_heads, qkv_bias=False):
        super().__init__()
        assert d_out % num_heads == 0, "d_out must be divisible by num_heads"

        self.d_out = d_out
        self.num_heads = num_heads
        self.head_dim = d_out // num_heads  # Reduce the projection dim to match desired output dim

        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.out_proj = nn.Linear(d_out, d_out)  # Linear layer to combine head outputs
        self.dropout = nn.Dropout(dropout)
        self.register_buffer(
            "mask",
            torch.triu(torch.ones(context_length, context_length, dtype=torch.bool), diagonal=1)
        )

    def forward(self, x):
        b, num_tokens, d_in = x.shape

        keys = self.W_key(x)  # Shape: (b, num_tokens, d_out)
        queries = self.W_query(x)
        values = self.W_value(x)
        # 拆分多个头
        keys = keys.view(b, num_tokens, self.num_heads, self.head_dim)
        values = values.view(b, num_tokens, self.num_heads, self.head_dim)
        queries = queries.view(b, num_tokens, self.num_heads, self.head_dim)

        # Transpose: (b, num_tokens, num_heads, head_dim) -> (b, num_heads, num_tokens, head_dim)
        keys = keys.transpose(1, 2)
        queries = queries.transpose(1, 2)
        values = values.transpose(1, 2)

        # Compute scaled dot-product attention (aka self-attention) with a causal mask
        attn_scores = queries @ keys.transpose(2, 3)  # Dot product for each head

        # Use the mask to fill attention scores
        attn_scores.masked_fill_(self.mask[:num_tokens, :num_tokens], -torch.inf)

        attn_weights = torch.softmax(attn_scores / keys.shape[-1]**0.5, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Shape: (b, num_tokens, num_heads, head_dim)
        context_vec = (attn_weights @ values).transpose(1, 2)

        # Combine heads, where self.d_out = self.num_heads * self.head_dim
        context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
        context_vec = self.out_proj(context_vec)  # optional projection

        return context_vec

mha = MultiHeadAttention(d_in=768, d_out=768, context_length=1024, dropout=0.1, num_heads=12)
x = torch.randn(2, 5, 768)
out = mha(x)
print(out.shape)  # torch.Size([2, 5, 768])
```

### Masked Multi-Head Self-Attention 输入输出

- Masked Multi-Head Self-Attention 的输入通常是经过 LayerNorm 的隐藏表示 $X \in \mathbb{R}^{B \times T \times d}$
- 每个 head 会先得到自己的 $Q,K,V$，在各自的子空间中独立计算注意力
- 所有 head 的结果拼接后再做一次线性投影，输出仍然是维度不变的隐藏表示 $Y \in \mathbb{R}^{B \times T \times d}$

实际实现里，注意力权重后面通常还会接一层 dropout 作为正则化；这不会改变主干数据流，只是训练时额外抑制过拟合。

## GELU + 前馈网络

自注意力负责在不同位置之间交换信息，前馈网络（Feed-Forward Network, FFN）则负责在单个位置内部做非线性变换。可以把它理解为一个逐位置应用的两层 MLP：序列中的每个 token 都会独立经过同一组参数，因此 FFN 不会直接混合不同位置的信息。

前馈网络通常由两层线性变换和一个激活函数组成：
$$
\text{FFN}(x) = W_2 \cdot \text{GELU}(W_1x + b_1) + b_2
$$
下面为 GELU 的数学公式：
$$
\text{GELU}(x) \approx 0.5x\left(1 + \tanh\left[\sqrt{\frac{2}{\pi}}(x + 0.044715x^3)\right]\right)
$$

在 GPT-2 风格实现里，中间维度通常会先从 $d$ 扩展到更大的维度（常见是 $4d$），经过 GELU 激活后再投影回 $d$。这样做的作用，是在不改变输入输出形状的前提下提升表示能力。

对应的 PyTorch 实现可以写成：

```python
import torch
import torch.nn as nn

class FeedForward(nn.Module):
    def __init__(self, emb_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(emb_dim, 4 * emb_dim),
            nn.GELU(),
            nn.Linear(4 * emb_dim, emb_dim),
        )

    def forward(self, x):
        return self.layers(x)

ffn = FeedForward(768)
x = torch.randn(2, 5, 768)
out = ffn(x)
print(out.shape)  # torch.Size([2, 5, 768])
```

## 残差连接

当网络层数变深时，训练会越来越困难。梯度传播可能不稳定，信息也容易在多层变换中衰减。为了解决这个问题，Transformer 借鉴了 ResNet 中一个非常关键的思想：残差连接（Residual Connection）。

它的形式很简单：
$$
y = x + F(x)
$$

它的含义是：子层不必从零开始学习一个完整映射，而是在输入 $x$ 的基础上学习一个“增量修正” $F(x)$。这样既保留了原始信息，也让深层训练更稳定。这也是为什么注意力子层和前馈子层通常都会保持输入输出维度一致。

## Transformer Block

前面介绍的模块真正发挥作用，是在 Transformer Block 内按固定模式组合起来。一个 GPT-2 风格的 Pre-LN Block 通常包含两个子层：

- $x = x + \text{MHA}(\text{LN}(x))$
- $x = x + \text{FFN}(\text{LN}(x))$

第一步先用 LayerNorm 稳定输入分布，再通过 masked self-attention 让各个位置交换信息；第二步再用另一层 LayerNorm 和 FFN，对每个位置的表示做进一步非线性变换。两步之后都通过残差连接把原始输入加回来。

<img
  src="/assets/transformer-block.svg"
  alt="Transformer Block 结构图"
  style="zoom: 50%;"
/>

需要注意的是，这个 Block 不会改变序列长度，也不会改变隐藏维度。正因为输入输出形状一致，多个 Block 才能自然地首尾相接、层层堆叠。

如果把单个 Block 看成一层“表示更新器”，那么堆叠多个 Block 的过程，就是让模型反复执行“跨位置聚合信息 + 逐位置变换特征”这两件事。浅层更可能捕捉局部词法模式，深层则更可能形成长程依赖、句法结构乃至更抽象的语义表示。

如果沿用前文已经定义好的 `LayerNorm`、`MultiHeadAttention` 和 `FeedForward`，那么对应的代码可以写成：

```python
import torch.nn as nn

class TransformerBlock(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.norm1 = LayerNorm(cfg["emb_dim"])
        self.att = MultiHeadAttention(
            d_in=cfg["emb_dim"],
            d_out=cfg["emb_dim"],
            context_length=cfg["context_length"],
            dropout=cfg["drop_rate"],
            num_heads=cfg["n_heads"],
            qkv_bias=cfg.get("qkv_bias", False),
        )
        self.norm2 = LayerNorm(cfg["emb_dim"])
        self.ff = FeedForward(cfg["emb_dim"])
        self.drop_shortcut = nn.Dropout(cfg["drop_rate"])

    def forward(self, x):
        x = x + self.drop_shortcut(self.att(self.norm1(x)))
        x = x + self.drop_shortcut(self.ff(self.norm2(x)))
        return x
```

## 输出层与生成

经过所有 Transformer Block 之后，隐藏状态会先经过最后一次 LayerNorm，再通过一个线性层把隐藏维度映射到词表维度。如果词表大小是 $V$，那么输出张量的形状就是 $\mathbb{R}^{B \times T \times V}$。其中，第 $t$ 个位置会输出一个长度为 $V$ 的 logits 向量，可以理解为模型根据 $x_1,\dots,x_t$ 这段上下文，对下一个 token 的未归一化打分。

在训练阶段，模型会充分利用并行计算的优势，一次性输出整个序列所有位置的 logits，并把第 $t$ 个位置的预测与真实的 $x_{t+1}$ 对齐，计算交叉熵损失（Cross-Entropy Loss）进行反向传播。

生成时，我们通常只关心最后一个位置的 logits，因为它对应“在当前上下文后面接什么 token”。对这组 logits 做 softmax 后，就可以把它解释为下一个 token 在整个词表上的概率分布。

在本文参考的 `gpt.py` 实现里，生成时直接对最后一个位置的 logits 取 `argmax`，因此使用的是 greedy decoding，而不是 sampling。sampling 则是在得到概率分布后，按照该分布随机抽取下一个 token。实际生成中，也常常会结合 temperature、top-k 或 top-p 等方法来控制生成结果。

## GPT-2 整体堆叠方式

前文是把组件拆开讲，这里再把它们放回完整模型中。

1. 输入文本经过 tokenizer，得到 token IDs。
2. token IDs 经过 Token Embedding。
3. 加上 Positional Embedding。
4. 送入多个 Transformer Block。
5. 经过最终的 LayerNorm。
6. 通过线性输出层映射到词表维度，得到每个位置上的 logits。
7. 生成时，通常只取最后一个位置的 logits 来决定下一个 token。

### GPTModel 代码说明

下面这段代码继续复用前文已经定义好的 `LayerNorm` 和 `TransformerBlock`。

```python
import torch
import torch.nn as nn

class GPTModel(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])

        self.trf_blocks = nn.Sequential(
            *[TransformerBlock(cfg) for _ in range(cfg["n_layers"])])

        self.final_norm = LayerNorm(cfg["emb_dim"])
        self.out_head = nn.Linear(cfg["emb_dim"], cfg["vocab_size"], bias=False)

    def forward(self, in_idx):
        batch_size, seq_len = in_idx.shape
        tok_embeds = self.tok_emb(in_idx)
        pos_embeds = self.pos_emb(torch.arange(seq_len, device=in_idx.device))
        x = tok_embeds + pos_embeds  # Shape [batch_size, num_tokens, emb_size]
        x = self.drop_emb(x)
        x = self.trf_blocks(x)
        x = self.final_norm(x)
        logits = self.out_head(x)
        return logits

cfg = {
    "vocab_size": 50257,
    "context_length": 1024,
    "emb_dim": 768,
    "n_heads": 12,
    "n_layers": 12,
    "drop_rate": 0.1,
    "qkv_bias": False,
}

model = GPTModel(cfg)
input_ids = torch.tensor([[40, 1842, 2807]], dtype=torch.long)
logits = model(input_ids)
print(logits.shape)  # torch.Size([1, 3, 50257])
```

这段代码把前文的组件明确串成了一条前向路径：`tok_emb + pos_emb -> dropout -> n 个 Transformer Block -> final_norm -> out_head`。和前面的抽象流程相比，这里额外出现的 `drop_emb` 属于正则化手段，训练时会随机丢弃一部分表示，推理时则关闭。

训练和生成这两个阶段需要分开理解。训练时，模型会同时为所有位置输出 logits，并把第 $t$ 个位置的预测与真实的 $x_{t+1}$ 对齐来计算 loss；生成时，模型虽然仍会输出整段序列的 logits，但通常只使用最后一个位置的结果来决定下一个 token。

从整体上看，GPT-2 风格模型的思想其实并不复杂。它并没有使用非常神秘的单一组件，而是把分词、嵌入、位置建模、自注意力、前馈网络、归一化和残差连接这些模块，有机地组合在一起。真正强大的地方，不在于某一个局部模块本身，而在于这些模块经过大规模堆叠、大规模训练后，能够形成极强的语言建模能力。

## 参考文章

- [Attention is All you Need](https://arxiv.org/abs/1706.03762)
- [Language Models are Unsupervised Multitask Learners (GPT-2)](https://cdn.openai.com/better-language-models/language-models.pdf)
- [LLMs from Scratch](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/gpt.py)
- [Layer Normalization](https://arxiv.org/abs/1607.06450)
- [Gaussian Error Linear Units (GELUs)](https://arxiv.org/abs/1606.08415)
- [Deep Residual Learning for Image Recognition (ResNet)](https://arxiv.org/abs/1512.03385)
