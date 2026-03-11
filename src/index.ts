import express, { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import {userData, contact} from "../types/type";
const app = express();
app.use(express.json());
const PORT = 3000;

async function createUniqueContact(userData:userData){
        const contacts = await prisma.contact.create({
        data:{
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            linkedId: null,
            deletedAt: null,
            linkPrecedence: "primary"
    }
});
}

async function createSecondaryContact(userData:userData,primaryId:number){
        const contacts = await prisma.contact.create({
        data:{
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            linkedId: primaryId,
            deletedAt: null,
            linkPrecedence: "secondary"
    }
});    
}

function generateResponse(res:Response,contacts:Array<contact>,oldest:{id:number}){
              return res.json({
                "contact":{
                "primaryContactId":oldest.id,
                "emails":[...new Set(contacts.map((contact)=>(contact.email)))],
                "phoneNumbers": [...new Set(contacts.map((contact)=>(contact.phoneNumber)))],
                "secondaryContactIds":[...new Set(contacts.slice(1).map((contact)=>{return contact.id}))]    
                }});
}

app.post("/identify", async (req: Request, res: Response) => {

    let contacts = await prisma.contact.findMany({
        where:{
            OR:
            [
                {email:req.body.email},
                {phoneNumber: req.body.phoneNumber}
            ]
            },
        orderBy:{createdAt: "asc"}
    });


    // ----> Creates a new unique contact<----
    if(contacts.length === 0){
        createUniqueContact(req.body);
        return res.json({
            "contact":{
             "primaryContactId": contacts.length + 1,
            "emails":[req.body.email],
            "phoneNumbers":[req.body.phoneNumber],
            "secondaryContactIds":[]
            }
        });
    }
    const oldest = contacts[0];
    // ----> Checks if request with duplicate request is sent <----
    contacts.forEach((contact)=>{
        if(req.body.email === contact.email && req.body.phoneNumber === contact.phoneNumber){
            return generateResponse(res,contacts,oldest)
        }
    });

    // ----> Sets every id other than primaryContact's precedence to "secondary" <----

    await prisma.contact.updateMany({
        where: {
            id: { not: oldest.id }
        },
        data: {
            linkPrecedence: "secondary"
        }
    });


    // ----> Check: if either email or phoneNumber from request is null, don't create contact<----
    if(!req.body.email || !req.body.phoneNumber){
        return generateResponse(res,contacts,oldest);
    }


    // ----> Creates a secondary contact <----
    createSecondaryContact(req.body, oldest.id);

    console.log(contacts);
  return generateResponse(res,contacts,oldest);
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});