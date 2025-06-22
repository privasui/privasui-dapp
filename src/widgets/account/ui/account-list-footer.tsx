import { RouteNames } from "@/routes";
import { Button } from "@/shared/ui/button";
import { Import, Plus } from "lucide-react";
import { useNavigate } from "react-router";

export const AccountListFooter = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate(`/${RouteNames.CreateAccount}`);
  };

  const handleImportAccount = () => {
    navigate(`/${RouteNames.ImportAccount}`);
  };
  return (
    <div className="w-full flex flex-col gap-3 py-3">
      <Button onClick={handleCreateAccount} className="p-7">
        <Plus size={16} /> Create New Account
      </Button>
      <Button onClick={handleImportAccount} className="p-7" variant="outline">
        <Import size={16} />
        Import Account
      </Button>
    </div>
  );
};
