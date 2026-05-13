import type { Response, Request } from "express";
import prisma from "../config/prisma.js";

// GET all users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

// Get one User

export const getUser = async (req: Request, res: Response) => {
    const id = parseInt(req.params["id"] as string);
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user" });
    }
}

export const createUser = async (req: Request, res: Response ) => {
    const { name, email, username, phone } = req.body;

    if(!name || !email || !username || !phone) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    if (await prisma.user.findUnique({ where: { email } })) {
        return res.status(400).json({ error: "Email already exists" });
    }

    if (await prisma.user.findUnique({ where: { username } })) {
        return res.status(400).json({
             error: "Username already exists" });
    }

    try {
        const newUser = await prisma.user.create({ data: { name, email, username, phone } });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: "Error creating user" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const id = req.params["id"] as string;

    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) return res.status(404).json({ error: "User not found" });

    const { name, email, username, phone, bio, avatar } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, username, phone, bio, avatar },
        });
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.log("Error updating user:", error);
        res.status(500).json({ message: "Error updating user" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const id = parseInt(req.params["id"] as string);
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
};
