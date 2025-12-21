import { ObjectId } from 'mongodb';

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    CLERK = 'CLERK',
    REVIEWER = 'REVIEWER',
    VIEWER = 'VIEWER'
}

export enum ApplicationStatus {
    PENDING = 'PENDING',
    UNDER_REVIEW = 'UNDER_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
    SUSPENDED = 'SUSPENDED'
}

export enum ApplicationPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER'
}

export enum MeansTestStatus {
    PASSED = 'PASSED',
    FAILED = 'FAILED',
    PENDING = 'PENDING'
}

export enum VerificationStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    FAILED = 'FAILED',
    MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export enum DocumentType {
    ID_DOCUMENT = 'ID_DOCUMENT',
    PROOF_OF_INCOME = 'PROOF_OF_INCOME',
    PROOF_OF_EXPENSES = 'PROOF_OF_EXPENSES',
    BANK_STATEMENT = 'BANK_STATEMENT',
    UTILITY_BILL = 'UTILITY_BILL',
    AFFIDAVIT = 'AFFIDAVIT',
    OTHER = 'OTHER'
}

export enum BenefitType {
    WATER_REBATE = 'WATER_REBATE',
    ELECTRICITY_REBATE = 'ELECTRICITY_REBATE',
    RATES_REBATE = 'RATES_REBATE',
    WASTE_REMOVAL_REBATE = 'WASTE_REMOVAL_REBATE',
    TRANSPORT_SUBSIDY = 'TRANSPORT_SUBSIDY',
    OTHER = 'OTHER'
}

export enum BenefitStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TERMINATED = 'TERMINATED',
    EXPIRED = 'EXPIRED'
}

export enum ConsentType {
    DATA_PROCESSING = 'DATA_PROCESSING',
    DATA_SHARING = 'DATA_SHARING',
    MARKETING = 'MARKETING',
    RESEARCH = 'RESEARCH'
}

export interface User {
    _id?: ObjectId;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Application {
    _id?: ObjectId;
    applicationNumber: string;
    status: ApplicationStatus;
    priority: ApplicationPriority;
    idNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: Gender;
    contactNumber: string;
    email?: string | null;
    address: string;
    municipality: string;
    ward?: string | null;
    householdSize: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    dependents: number;
    applicationDate: Date;
    reviewDate?: Date | null;
    approvalDate?: Date | null;
    expiryDate?: Date | null;
    rejectionReason?: string | null;
    notes?: string | null;
    meansTestScore?: number | null;
    meansTestStatus?: MeansTestStatus | null;
    verificationStatus: VerificationStatus;
    createdById: ObjectId;
    reviewedById?: ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface HouseholdMember {
    _id?: ObjectId;
    applicationId: ObjectId;
    idNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    relationship: string;
    isDependent: boolean;
    monthlyIncome?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Document {
    _id?: ObjectId;
    applicationId: ObjectId;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    documentType: DocumentType;
    uploadedBy: string;
    verified: boolean;
    verifiedAt?: Date | null;
    verifiedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface Benefit {
    _id?: ObjectId;
    applicationId: ObjectId;
    benefitType: BenefitType;
    amount: number;
    startDate: Date;
    endDate?: Date | null;
    status: BenefitStatus;
    paymentMethod?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConsentRecord {
    _id?: ObjectId;
    applicationId?: ObjectId | null;
    userId?: ObjectId | null;
    consentType: ConsentType;
    granted: boolean;
    grantedAt?: Date | null;
    revokedAt?: Date | null;
    purpose: string;
    legalBasis: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    _id?: ObjectId;
    userId?: ObjectId | null;
    applicationId?: ObjectId | null;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date;
}

export interface IntegrationLog {
    _id?: ObjectId;
    integrationType: string;
    endpoint: string;
    method: string;
    requestData?: any;
    responseData?: any;
    statusCode: number;
    success: boolean;
    errorMessage?: string | null;
    duration?: number | null;
    createdAt: Date;
}

export interface SystemConfig {
    _id?: ObjectId;
    key: string;
    value: string;
    description?: string | null;
    category?: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
