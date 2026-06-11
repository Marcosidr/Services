import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

type PasswordResetCodeAttributes = InferAttributes<PasswordResetCode, {
  omit: "createdAt" | "updatedAt";
}>;

type PasswordResetCodeCreationAttributes = InferCreationAttributes<PasswordResetCode, {
  omit: "id" | "createdAt" | "updatedAt" | "attempts" | "verifiedUntil" | "usedAt";
}>;

export class PasswordResetCode extends Model<
  PasswordResetCodeAttributes,
  PasswordResetCodeCreationAttributes
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare email: string;
  declare codeHash: string;
  declare expiresAt: Date;
  declare attempts: CreationOptional<number>;
  declare verifiedUntil: Date | null;
  declare usedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initPasswordResetCodeModel(sequelize: Sequelize) {
  PasswordResetCode.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },
      email: {
        type: DataTypes.STRING(180),
        allowNull: false,
        validate: { isEmail: true }
      },
      codeHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: "code_hash"
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at"
      },
      attempts: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0
      },
      verifiedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "verified_until"
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "used_at"
      }
    },
    {
      sequelize,
      tableName: "password_reset_codes",
      indexes: [
        { name: "idx_password_reset_codes_user_id", fields: ["user_id"] },
        { name: "idx_password_reset_codes_email", fields: ["email"] },
        { name: "idx_password_reset_codes_expires_at", fields: ["expires_at"] },
        { name: "idx_password_reset_codes_used_at", fields: ["used_at"] }
      ]
    }
  );

  return PasswordResetCode;
}
