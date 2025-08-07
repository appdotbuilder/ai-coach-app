
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      name: 'Jane Doe',
      email: 'john.doe@example.com' // Same email
    };

    await expect(createUser(duplicateInput)).rejects.toThrow();
  });

  it('should create multiple users with different emails', async () => {
    const firstUser = await createUser(testInput);

    const secondInput: CreateUserInput = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com'
    };

    const secondUser = await createUser(secondInput);

    // Verify both users exist
    const users = await db.select().from(usersTable).execute();
    expect(users).toHaveLength(2);
    expect(users.map(u => u.email)).toContain('john.doe@example.com');
    expect(users.map(u => u.email)).toContain('jane.doe@example.com');
  });
});
