import { Routes, Route } from "react-router-dom";
import { Layout } from "@/Layout";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { Toaster } from "@/components/ui/sonner";
import { SeedStatuses } from "@/components/SeedStatuses";

export default function App() {
  return (
    <>
      <SeedStatuses />
      <Layout>
        <Routes>
          <Route path="/" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </Layout>
      <Toaster richColors />
    </>
  );
}
