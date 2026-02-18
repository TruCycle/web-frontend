import { createContext, useContext, useState, type ReactNode } from 'react';

type UserRole = 'collector' | 'donor';

interface UserRoleContextType {
    role: UserRole;
    isDonorMode: boolean;
    setRole: (role: UserRole) => void;
    toggleRole: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
    const [role, setRoleState] = useState<UserRole>('collector');

    const setRole = (newRole: UserRole) => {
        setRoleState(newRole);
    };

    const toggleRole = () => {
        setRoleState((prev) => (prev === 'collector' ? 'donor' : 'collector'));
    };

    const isDonorMode = role === 'donor';

    return (
        <UserRoleContext.Provider value={{ role, isDonorMode, setRole, toggleRole }}>
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRole() {
    const context = useContext(UserRoleContext);
    if (context === undefined) {
        throw new Error('useUserRole must be used within a UserRoleProvider');
    }
    return context;
}
