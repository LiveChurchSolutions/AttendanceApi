import { PrismaClient } from '@prisma/client'

export class PrismaHelper {

    static existingClient: PrismaClient = null;

    static getClient = () => {
        if (PrismaHelper.existingClient === null) {
            PrismaHelper.existingClient = new PrismaClient({ log: [] });
        }
        return PrismaHelper.existingClient;
    }

}