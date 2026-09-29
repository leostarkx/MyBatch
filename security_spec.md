# Security Specification - Dafaaty (My Batch) App

## Data Invariants
1. A user can only edit their own profile.
2. Only Owners, Admins, and Representatives can create/edit batches.
3. Only Representatives of a batch can manage join requests for that batch.
4. Students can only see data (announcements, courses, etc.) for the batch they belong to.
5. Representatives can only manage data for their own batch.
6. Chat messages must belong to a batch and can only be read/written by members of that batch.
7. Attendance and grades can only be managed by Admins, Owners, or Representatives.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a user profile with a different `uid` than the authenticated user.
2. **Role Escalation**: A student attempting to update their own role to 'ADMIN'.
3. **Cross-Batch Access**: A student in Batch A attempting to read announcements from Batch B.
4. **Unauthorized Deletion**: A student attempting to delete a batch.
5. **PII Leak**: An unauthenticated user attempting to read the `users` collection.
6. **Chat Hijacking**: A user from Batch A attempting to post a message to Batch B's chat.
7. **Ghost Joining**: A user attempting to approve their own join request.
8. **Impersonation**: A user attempting to send a chat message as another user.
9. **Settings Manipulation**: A student attempting to lock/unlock the chat.
10. **Data Poisoning**: Attempting to set a grade to a 1GB string.
11. **Orphaned Schedule**: Creating a schedule for a batch that does not exist.
12. **Future Timestamp**: Setting `updatedAt` to a time in the future (not server time).

## Test Runner (Conceptual)
All the above payloads should return `PERMISSION_DENIED`.
