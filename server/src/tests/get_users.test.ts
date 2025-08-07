
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify first user
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    // Verify second user
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return users in database insertion order', async () => {
    // Create users in specific order
    const user1 = await db.insert(usersTable)
      .values({
        name: 'First User',
        email: 'first@example.com'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        name: 'Second User',  
        email: 'second@example.com'
      })
      .returning()
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(user1[0].id);
    expect(result[1].id).toEqual(user2[0].id);
    expect(result[0].name).toEqual('First User');
    expect(result[1].name).toEqual('Second User');
  });
});
