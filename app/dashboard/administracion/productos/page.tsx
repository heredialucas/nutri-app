import { getProductsWithWarehouseStock } from "@/app/actions/inventory";
import { getCurrentUser, hasPermission, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UnauthorizedAccess } from "@/components/unauthorized-access";
import { AdminProductList } from "@/components/administracion/admin-product-list";
import { Package } from "lucide-react";

export default async function AdminProductsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/login");
    }

    if (!hasPermission(user, "adminProducts.view")) {
        return <UnauthorizedAccess action="ver" resource="productos" />;
    }

    const canManage = hasPermission(user, "adminProducts.manage");
    const canRestore = isSuperAdmin(user);
    const { products: allProducts, warehouses } = await getProductsWithWarehouseStock();
    // Solo el administrador principal puede consultar productos eliminados para restaurarlos.
    const products = canRestore ? allProducts : allProducts.filter((product: any) => !product.isDeleted);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Productos</h1>
                    <p className="text-muted-foreground text-sm">
                        Gestión de stock mínimo y distribución por depósitos
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Productos</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                        {products.filter((p: any) => !p.isDeleted).length}
                    </div>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Con Stock</span>
                    </div>
                    <div className="text-2xl font-bold mt-1 text-green-600">
                        {products.filter((p: any) => !p.isDeleted && p.totalStock > 0).length}
                    </div>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">Bajo Mínimo</span>
                    </div>
                    <div className="text-2xl font-bold mt-1 text-amber-600">
                        {products.filter((p: any) => !p.isDeleted && p.totalStock <= p.minStock && p.totalStock > 0).length}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <Package className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Catálogo de Productos</h2>
                </div>
                <AdminProductList 
                    products={products} 
                    warehouses={warehouses} 
                    canManage={canManage} 
                    canRestore={canRestore}
                />
            </div>
        </div>
    );
}
