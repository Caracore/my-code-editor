export interface FileNode {
    path: string;
    name: string;
    isDir: boolean;
    children?: FileNode[];
    expanded?: boolean;
}