/**
 * 文件树节点模型
 * 用于 DocumentService 递归加载文件树结构时的类型注解
 */
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  subFileCount: number;
}
