export const userRoles: string[] = ['user'];
export const superAdminRoles: string[] = ['superadmin'];
export const demoAdminRoles: string[] = ['demoadmin'];
export const realAdminRoles: string[] = superAdminRoles.concat(['admin']);
export const allAdminRoles: string[] = realAdminRoles.concat(demoAdminRoles);
