export const katexOptions = {
  strict(errorCode: string) {
    return errorCode === 'newLineInDisplayMode' ? 'ignore' : 'warn';
  },
};
