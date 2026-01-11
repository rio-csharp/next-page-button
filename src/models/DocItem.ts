/**
 * File tree node model used for DocumentService when recursively loading file tree structure.
 */
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  subFileCount: number;
}
