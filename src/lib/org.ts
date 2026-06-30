import { prisma } from "./prisma";

export type OrgTreeNode = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  department: string;
  children: OrgTreeNode[];
};

export async function getOrgTree(): Promise<OrgTreeNode[]> {
  const nodes = await prisma.orgNode.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const map = new Map<string, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];

  for (const n of nodes) {
    map.set(n.id, {
      id: n.id,
      name: n.name,
      title: n.title,
      email: n.email,
      department: n.department,
      children: [],
    });
  }

  for (const n of nodes) {
    const item = map.get(n.id)!;
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}
