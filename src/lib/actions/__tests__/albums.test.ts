import { createAlbumInvite } from '../albums'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'
import { AlbumRole } from '@/types'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/auth-utils')
jest.mock('@/lib/email', () => ({
  sendAlbumInviteEmail: jest.fn(),
  getInviteAcceptUrl: jest.fn((token: string) => `http://test.com/invite/${token}`),
}))

describe('createAlbumInvite', () => {
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    eq: jest.Mock
    is: jest.Mock
    insert: jest.Mock
    single: jest.Mock
  }
  const mockUser = { id: 'user-123', email: 'inviter@example.com' }
  const albumId = 'album-123'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock auth
    ;(requireAuth as jest.Mock).mockResolvedValue(mockUser)
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('when inviting an existing album member', () => {
    beforeEach(() => {
      // Mock profile lookup - user exists
      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: 'existing-user-123' }, error: null })
        // Mock album member lookup - user is already a member
        .mockResolvedValueOnce({ data: { id: 'member-123' }, error: null })
    })

    it('should throw an error when user is already a member', async () => {
      await expect(
        createAlbumInvite(albumId, 'existing@example.com', AlbumRole.VIEWER)
      ).rejects.toThrow('This user is already a member of the album')

      // Verify the queries were made
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'existing@example.com')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('album_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('album_id', albumId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'existing-user-123')
    })
  })

  describe('when inviting a user with an existing pending invite', () => {
    beforeEach(() => {
      // Mock profile lookup - user doesn't exist
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock existing invite lookup - invite exists
        .mockResolvedValueOnce({ data: { id: 'invite-123' }, error: null })
    })

    it('should throw an error when invitation already exists', async () => {
      await expect(
        createAlbumInvite(albumId, 'newuser@example.com', AlbumRole.VIEWER)
      ).rejects.toThrow('An invitation has already been sent to this email')

      // Verify the queries were made
      expect(mockSupabase.from).toHaveBeenCalledWith('album_invites')
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'newuser@example.com')
      expect(mockSupabase.is).toHaveBeenCalledWith('used_at', null)
    })
  })

  describe('when inviting a new user successfully', () => {
    const mockInvite = {
      id: 'invite-456',
      album_id: albumId,
      email: 'newuser@example.com',
      role: AlbumRole.VIEWER,
      token: 'test-token-123',
    }

    beforeEach(() => {
      // Mock profile lookup - user doesn't exist
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock existing invite lookup - no invite
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock invite creation
        .mockResolvedValueOnce({ data: mockInvite, error: null })
        // Mock album lookup
        .mockResolvedValueOnce({ data: { name: 'Test Album' }, error: null })
        // Mock inviter profile lookup
        .mockResolvedValueOnce({ data: { full_name: 'Test User' }, error: null })
    })

    it('should create invitation successfully for non-existing user', async () => {
      const result = await createAlbumInvite(albumId, 'NewUser@Example.com', AlbumRole.VIEWER)

      expect(result).toEqual(mockInvite)
      
      // Verify email was normalized
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'newuser@example.com')
      
      // Verify invitation was created
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          album_id: albumId,
          email: 'newuser@example.com',
          invited_by: mockUser.id,
          role: AlbumRole.VIEWER,
          token: expect.any(String),
          expires_at: expect.any(String),
        })
      )
    })
  })

  describe('when inviting an existing user who is not a member', () => {
    const mockInvite = {
      id: 'invite-789',
      album_id: albumId,
      email: 'existingnotmember@example.com',
      role: AlbumRole.CONTRIBUTOR,
      token: 'test-token-456',
    }

    beforeEach(() => {
      // Mock profile lookup - user exists
      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: 'existing-user-456' }, error: null })
        // Mock album member lookup - user is NOT a member
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock existing invite lookup - no invite
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock invite creation
        .mockResolvedValueOnce({ data: mockInvite, error: null })
        // Mock album lookup
        .mockResolvedValueOnce({ data: { name: 'Test Album' }, error: null })
        // Mock inviter profile lookup
        .mockResolvedValueOnce({ data: { full_name: 'Test User' }, error: null })
    })

    it('should create invitation successfully for existing user who is not a member', async () => {
      const result = await createAlbumInvite(albumId, 'existingnotmember@example.com', AlbumRole.CONTRIBUTOR)

      expect(result).toEqual(mockInvite)
      
      // Verify user lookup was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'existingnotmember@example.com')
      
      // Verify member check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('album_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'existing-user-456')
      
      // Verify invitation was created
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })
})