export interface Link {
  name: string;
  url: string;
  description: string;
}

export const links: Link[] = [
  {
    name: '示例友链1',
    url: 'https://example.com',
    description: '这是示例友链描述',
  },
  {
    name: '示例友链2',
    url: 'https://example.org',
    description: '这是另一个示例友链描述',
  },
];
