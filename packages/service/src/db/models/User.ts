// MongoDB Mongoose Model: User
// 用户 + 个人档案

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserProfile {
  gender?: 'male' | 'female' | 'unknown';
  birthDate?: Date;
  bloodType?: 'A' | 'B' | 'AB' | 'O' | 'unknown';
  height?: number;
  weight?: number;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  familyHistory?: string;
}

export interface IUser extends Document {
  name: string;
  passwordHash: string;
  wxworkUserId?: string;
  role: 'doctor' | 'patient' | 'admin';
  mobile?: string;
  avatar?: string;
  profile: IUserProfile;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    birthDate: { type: Date },
    bloodType: { type: String, enum: ['A', 'B', 'AB', 'O', 'unknown'], default: 'unknown' },
    height: { type: Number },
    weight: { type: Number },
    allergies: { type: [String], default: [] },
    chronicDiseases: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    familyHistory: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    wxworkUserId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['doctor', 'patient', 'admin'], default: 'patient' },
    mobile: { type: String },
    avatar: { type: String },
    profile: { type: UserProfileSchema, default: () => ({ allergies: [], chronicDiseases: [], currentMedications: [] }) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
