
interface userData{
    email:string, 
    phoneNumber:string
}

interface contact  {
    phoneNumber: string | null;
    email: string | null;
    linkPrecedence: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    id: number;
    linkedId: number | null;
}

export {userData, contact};