const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const postsDirectory = path.join(rootDir, 'posts');
const outDirectory = path.join(rootDir, 'out');

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 遍历 posts 目录，查找带有 assets 的子目录
function copyPostAssets() {
  if (!fs.existsSync(postsDirectory)) {
    console.log('posts directory not found');
    return;
  }

  const entries = fs.readdirSync(postsDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = path.join(postsDirectory, entry.name);
      const assetsPath = path.join(subDirPath, 'assets');

      // 检查子目录中是否有 .md 文件和 assets 目录
      const dirFiles = fs.readdirSync(subDirPath);
      const hasMdFile = dirFiles.some(f => f.endsWith('.md'));
      const hasAssets = fs.existsSync(assetsPath) && fs.statSync(assetsPath).isDirectory();

      if (hasMdFile && hasAssets) {
        const destAssetsPath = path.join(outDirectory, 'post', entry.name, 'assets');
        console.log(`Copying assets for post: ${entry.name}`);
        copyDir(assetsPath, destAssetsPath);
      }
    }
  }

  console.log('Post assets copied successfully!');
}

copyPostAssets();
