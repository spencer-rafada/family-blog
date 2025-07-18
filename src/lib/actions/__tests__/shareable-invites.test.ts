import { createShareableInvite, getShareableInvites, acceptAlbumInvite } from '../invites'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'
import { AlbumRole } from '@/types'
import { SupabaseErrorCode } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/auth-utils')
jest.mock('@/lib/invite-utils', () => ({
  getInviteAcceptUrl: jest.fn((token: string) => `http://test.com/invite/${token}`),
}))

describe('createShareableInvite', () => {
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    eq: jest.Mock
    is: jest.Mock
    gt: jest.Mock
    insert: jest.Mock
    single: jest.Mock
  }
  const mockUser = { id: 'user-123', email: 'admin@example.com' }
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
      gt: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('when user is not an admin', () => {
    beforeEach(() => {
      // Mock membership lookup - user is a viewer
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { role: AlbumRole.VIEWER }, 
        error: null 
      })
    })

    it('should throw an error when user is not an admin', async () => {
      await expect(
        createShareableInvite(albumId, AlbumRole.VIEWER)
      ).rejects.toThrow('Only album admins can create invites')

      // Verify membership check was made
      expect(mockSupabase.from).toHaveBeenCalledWith('album_members')
      expect(mockSupabase.eq).toHaveBeenCalledWith('album_id', albumId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })
  })

  describe('when user is not a member', () => {
    beforeEach(() => {
      // Mock membership lookup - user is not a member
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Not found' } 
      })
    })

    it('should throw an error when user does not have access', async () => {
      await expect(
        createShareableInvite(albumId, AlbumRole.VIEWER)
      ).rejects.toThrow('You do not have access to this album')
    })
  })

  describe('when creating shareable invite successfully', () => {
    const mockInvite = {
      id: 'invite-123',
      album_id: albumId,
      email: '',
      invited_by: mockUser.id,
      role: AlbumRole.VIEWER,
      token: 'test-token-123',
      is_shareable: true,
      max_uses: null,
      uses_count: 0,
    }

    beforeEach(() => {
      // Mock membership lookup - user is an admin
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: AlbumRole.ADMIN }, error: null })
        // Mock invite creation
        .mockResolvedValueOnce({ data: mockInvite, error: null })
    })

    it('should create shareable invite with unlimited uses', async () => {
      const result = await createShareableInvite(albumId, AlbumRole.VIEWER)

      expect(result).toEqual(mockInvite)
      
      // Verify invite was created with correct parameters
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          album_id: albumId,
          email: '',
          invited_by: mockUser.id,
          role: AlbumRole.VIEWER,
          token: expect.any(String),
          expires_at: expect.any(String),
          is_shareable: true,
          max_uses: null,
          uses_count: 0,
        })
      )
    })

    it('should create shareable invite with limited uses', async () => {
      const maxUses = 10
      const limitedInvite = { ...mockInvite, max_uses: maxUses }
      
      // Update mock for limited invite
      mockSupabase.single.mockReset()
      mockSupabase.single
        .mockResolvedValueOnce({ data: { role: AlbumRole.ADMIN }, error: null })
        .mockResolvedValueOnce({ data: limitedInvite, error: null })

      const result = await createShareableInvite(albumId, AlbumRole.VIEWER, maxUses)

      expect(result).toEqual(limitedInvite)
      
      // Verify max_uses was set
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          max_uses: maxUses,
        })
      )
    })
  })
})

describe('getShareableInvites', () => {
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    eq: jest.Mock
    is: jest.Mock
    gt: jest.Mock
    order: jest.Mock
    single: jest.Mock
  }
  const mockUser = { id: 'user-123', email: 'admin@example.com' }
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
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('when user is not an admin', () => {
    beforeEach(() => {
      // Mock membership lookup - user is a viewer
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { role: AlbumRole.VIEWER }, 
        error: null 
      })
    })

    it('should throw an error', async () => {
      await expect(
        getShareableInvites(albumId)
      ).rejects.toThrow('Only album admins can view invites')
    })
  })

  describe('when fetching shareable invites successfully', () => {
    const mockInvites = [
      {
        id: 'invite-1',
        album_id: albumId,
        is_shareable: true,
        uses_count: 3,
        max_uses: 10,
        role: AlbumRole.VIEWER,
        inviter: { full_name: 'Admin User' },
      },
      {
        id: 'invite-2',
        album_id: albumId,
        is_shareable: true,
        uses_count: 0,
        max_uses: null,
        role: AlbumRole.CONTRIBUTOR,
        inviter: { full_name: 'Another Admin' },
      },
    ]

    beforeEach(() => {
      // Mock membership lookup - user is an admin
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { role: AlbumRole.ADMIN }, 
        error: null 
      })
      // Mock invites fetch
      mockSupabase.order.mockResolvedValueOnce({ 
        data: mockInvites, 
        error: null 
      })
    })

    it('should return all shareable invites', async () => {
      const result = await getShareableInvites(albumId)

      expect(result).toEqual(mockInvites)
      
      // Verify correct filters were applied
      expect(mockSupabase.eq).toHaveBeenCalledWith('album_id', albumId)
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_shareable', true)
      expect(mockSupabase.is).toHaveBeenCalledWith('used_at', null)
      expect(mockSupabase.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })
})

describe('acceptAlbumInvite with shareable invites', () => {
  let mockSupabase: {
    from: jest.Mock
    select: jest.Mock
    eq: jest.Mock
    is: jest.Mock
    gt: jest.Mock
    insert: jest.Mock
    single: jest.Mock
    rpc: jest.Mock
  }
  const mockUser = { id: 'user-123', email: 'user@example.com' }
  const token = 'test-token-123'
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
      gt: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn().mockReturnThis(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('when accepting a shareable invite', () => {
    const mockShareableInvite = {
      id: 'invite-123',
      album_id: albumId,
      email: '',
      role: AlbumRole.VIEWER,
      token: token,
      is_shareable: true,
      max_uses: 10,
      uses_count: 5,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }

    beforeEach(() => {
      // Mock invite lookup
      mockSupabase.single.mockResolvedValueOnce({ 
        data: mockShareableInvite, 
        error: null 
      })
    })

    it('should accept invite when user is not already a member', async () => {
      // Mock member check - not a member
      mockSupabase.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: SupabaseErrorCode.NOT_FOUND } 
      })
      
      // Mock member insert
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: { id: 'member-123' }, 
        error: null 
      })
      
      // Mock increment uses count
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      })

      const result = await acceptAlbumInvite(token)

      expect(result).toBe(albumId)
      
      // Verify member was added
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        album_id: albumId,
        user_id: mockUser.id,
        role: AlbumRole.VIEWER,
      })
      
      // Verify uses count was incremented
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_invite_uses_count', {
        invite_token: token,
      })
    })

    it('should reject when user is already a member', async () => {
      // Mock member check - already a member
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { id: 'member-123' }, 
        error: null 
      })

      await expect(
        acceptAlbumInvite(token)
      ).rejects.toThrow('You are already a member of this album')
    })

    it('should reject when max uses is reached', async () => {
      const maxedOutInvite = {
        ...mockShareableInvite,
        max_uses: 10,
        uses_count: 10,
      }
      
      // Override invite lookup
      mockSupabase.single.mockReset()
      mockSupabase.single.mockResolvedValueOnce({ 
        data: maxedOutInvite, 
        error: null 
      })

      await expect(
        acceptAlbumInvite(token)
      ).rejects.toThrow('This invite link has reached its maximum number of uses')
    })

    it('should accept invite with unlimited uses', async () => {
      const unlimitedInvite = {
        ...mockShareableInvite,
        token: token,
        max_uses: null,
        uses_count: 100,
      }
      
      // Override invite lookup
      mockSupabase.single.mockReset()
      mockSupabase.single
        .mockResolvedValueOnce({ data: unlimitedInvite, error: null })
        // Mock member check - not a member
        .mockResolvedValueOnce({ data: null, error: { code: SupabaseErrorCode.NOT_FOUND } })
      
      // Mock member insert
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: { id: 'member-123' }, 
        error: null 
      })
      
      // Mock increment uses count
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      })

      const result = await acceptAlbumInvite(token)

      expect(result).toBe(albumId)
      // Should not throw error even with high uses_count
    })
  })

  describe('when accepting an email invite', () => {
    const mockEmailInvite = {
      id: 'invite-123',
      album_id: albumId,
      email: 'user@example.com',
      role: AlbumRole.VIEWER,
      token: token,
      is_shareable: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }

    beforeEach(() => {
      // Mock invite lookup
      mockSupabase.single.mockResolvedValueOnce({ 
        data: mockEmailInvite, 
        error: null 
      })
    })

    it('should accept invite when email matches', async () => {
      // Mock profile lookup - email matches
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { email: 'user@example.com' }, 
        error: null 
      })
      
      // Mock member insert
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: { id: 'member-123' }, 
        error: null 
      })
      
      // Mock mark as used
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      })

      const result = await acceptAlbumInvite(token)

      expect(result).toBe(albumId)
      
      // Verify mark_invite_as_used was called for email invite
      expect(mockSupabase.rpc).toHaveBeenCalledWith('mark_invite_as_used', {
        invite_token: token,
        user_email: mockEmailInvite.email,
      })
    })

    it('should reject when email does not match', async () => {
      // Mock profile lookup - email doesn't match
      mockSupabase.single.mockResolvedValueOnce({ 
        data: { email: 'different@example.com' }, 
        error: null 
      })

      await expect(
        acceptAlbumInvite(token)
      ).rejects.toThrow('This invite is for a different email address')
    })
  })
})