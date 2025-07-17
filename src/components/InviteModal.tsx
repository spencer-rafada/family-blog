'use client'

import { useReducer, useState } from 'react'
import { createAlbumInvite, createShareableInvite } from '@/lib/actions/albums'
import { AlbumRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, Edit3, Eye, UserPlus, Mail, Link, Copy, Check } from 'lucide-react'
import { getInviteAcceptUrl } from '@/lib/invite-utils'

// State types
type InviteModalState = {
  activeTab: 'email' | 'link'
  formData: {
    email: string
    role: AlbumRole
    maxUses?: number
  }
  request: {
    status: 'idle' | 'loading' | 'success' | 'error'
    error?: string
  }
  generatedLink?: string
}

type InviteModalAction =
  | { type: 'SET_TAB'; payload: 'email' | 'link' }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_ROLE'; payload: AlbumRole }
  | { type: 'SET_MAX_USES'; payload: number | undefined }
  | { type: 'START_REQUEST' }
  | { type: 'REQUEST_SUCCESS'; generatedLink?: string }
  | { type: 'REQUEST_ERROR'; error: string }
  | { type: 'RESET' }

// Initial state
const initialState: InviteModalState = {
  activeTab: 'email',
  formData: {
    email: '',
    role: AlbumRole.VIEWER,
    maxUses: undefined,
  },
  request: {
    status: 'idle',
  },
}

// Reducer
function inviteModalReducer(state: InviteModalState, action: InviteModalAction): InviteModalState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload, request: { status: 'idle' } }
    case 'SET_EMAIL':
      return { ...state, formData: { ...state.formData, email: action.payload } }
    case 'SET_ROLE':
      return { ...state, formData: { ...state.formData, role: action.payload } }
    case 'SET_MAX_USES':
      return { ...state, formData: { ...state.formData, maxUses: action.payload } }
    case 'START_REQUEST':
      return { ...state, request: { status: 'loading' } }
    case 'REQUEST_SUCCESS':
      return {
        ...state,
        request: { status: 'success' },
        generatedLink: action.generatedLink || state.generatedLink,
      }
    case 'REQUEST_ERROR':
      return { ...state, request: { status: 'error', error: action.error } }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  albumId: string
  albumName: string
  onInviteSuccess?: () => void
}

export function InviteModal({ isOpen, onClose, albumId, albumName, onInviteSuccess }: InviteModalProps) {
  const [state, dispatch] = useReducer(inviteModalReducer, initialState)
  const [copied, setCopied] = useState(false)
  
  // Derived state
  const isLoading = state.request.status === 'loading'
  const hasError = state.request.status === 'error'
  const isSuccess = state.request.status === 'success'

  const roleOptions = [
    {
      value: AlbumRole.ADMIN,
      label: 'Admin',
      description: 'Can manage the album and invite others',
      icon: Crown,
      iconColor: 'text-yellow-500',
    },
    {
      value: AlbumRole.CONTRIBUTOR,
      label: 'Contributor', 
      description: 'Can add posts and memories',
      icon: Edit3,
      iconColor: 'text-green-500',
    },
    {
      value: AlbumRole.VIEWER,
      label: 'Viewer',
      description: 'Can view content only',
      icon: Eye,
      iconColor: 'text-gray-500',
    },
  ]

  const selectedRoleOption = roleOptions.find(option => option.value === state.formData.role)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'START_REQUEST' })

    try {
      if (!state.formData.email.trim()) {
        throw new Error('Email address is required')
      }

      if (!state.formData.email.includes('@')) {
        throw new Error('Please enter a valid email address')
      }

      await createAlbumInvite(albumId, state.formData.email.trim(), state.formData.role)
      
      dispatch({ type: 'REQUEST_SUCCESS' })
      
      // Call success callback after short delay to show success message
      setTimeout(() => {
        onInviteSuccess?.()
        handleClose()
      }, 1500)
      
    } catch (err) {
      dispatch({ 
        type: 'REQUEST_ERROR', 
        error: err instanceof Error ? err.message : 'Failed to send invite' 
      })
    }
  }

  const handleGenerateLink = async () => {
    dispatch({ type: 'START_REQUEST' })

    try {
      const invite = await createShareableInvite(albumId, state.formData.role, state.formData.maxUses)
      const inviteUrl = getInviteAcceptUrl(invite.token)
      dispatch({ type: 'REQUEST_SUCCESS', generatedLink: inviteUrl })
    } catch (err) {
      dispatch({ 
        type: 'REQUEST_ERROR', 
        error: err instanceof Error ? err.message : 'Failed to generate link' 
      })
    }
  }

  const handleCopyLink = async () => {
    if (!state.generatedLink) return

    try {
      await navigator.clipboard.writeText(state.generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleClose = () => {
    dispatch({ type: 'RESET' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite to {albumName}
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join this album with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={state.activeTab} onValueChange={(value) => dispatch({ type: 'SET_TAB', payload: value as 'email' | 'link' })}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email Invite
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-4 h-4 mr-2" />
              Shareable Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={state.formData.email}
                  onChange={(e) => dispatch({ type: 'SET_EMAIL', payload: e.target.value })}
                  placeholder="Enter email address..."
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role & Permissions</Label>
                <Select 
                  value={state.formData.role} 
                  onValueChange={(value: AlbumRole) => dispatch({ type: 'SET_ROLE', payload: value })}
                >
                  <SelectTrigger data-testid="role-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          data-testid={`role-option-${option.value}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${option.iconColor}`} />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                
                {selectedRoleOption && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded" data-testid="role-description">
                    <strong>{selectedRoleOption.label}:</strong> {selectedRoleOption.description}
                  </div>
                )}
              </div>

              {hasError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {state.request.error}
                </div>
              )}

              {isSuccess && state.activeTab === 'email' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  Invitation sent to {state.formData.email}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="link">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-link">Role & Permissions</Label>
                <Select 
                  value={state.formData.role} 
                  onValueChange={(value: AlbumRole) => dispatch({ type: 'SET_ROLE', payload: value })}
                >
                  <SelectTrigger id="role-link" data-testid="role-select-trigger-link">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          data-testid={`role-option-link-${option.value}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${option.iconColor}`} />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-uses">Maximum Uses (Optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={state.formData.maxUses || ''}
                  onChange={(e) => dispatch({ 
                    type: 'SET_MAX_USES', 
                    payload: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Unlimited"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Leave empty for unlimited uses. Link expires in 30 days.
                </p>
              </div>

              {state.generatedLink && (
                <div className="space-y-2">
                  <Label>Generated Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={state.generatedLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Share this link on Facebook, WhatsApp, or any platform!
                  </p>
                </div>
              )}

              {hasError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {state.request.error}
                </div>
              )}

              {isSuccess && state.activeTab === 'link' && !state.generatedLink && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  Shareable link generated!
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  {state.generatedLink ? 'Done' : 'Cancel'}
                </Button>
                {!state.generatedLink && (
                  <Button onClick={handleGenerateLink} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Link'}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}