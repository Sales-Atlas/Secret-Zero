import { LogOut } from 'lucide-react';

import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';

/**
 * Renders a logout button that submits the `logoutAction` server action.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </form>
  );
}
