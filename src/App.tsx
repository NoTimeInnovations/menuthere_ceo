import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Layout } from "@/Layout";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomersTablePage } from "@/pages/CustomersTablePage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { TodosPage } from "@/pages/TodosPage";
import { Toaster } from "@/components/ui/sonner";
import { SeedStatuses } from "@/components/SeedStatuses";

function ScrollToTopOnNonRoot() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <SeedStatuses />
      <ScrollToTopOnNonRoot />
      <Layout>
        <Routes>
          <Route path="/" element={<CustomersTablePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </Layout>
      <Toaster richColors />
    </>
  );
}
