import { useAutoJoin, useAutoJoinForCurrentUser } from '@voyatek/callpad-sdk'
import { useSdk } from '@voyatek/callpad-sdk'

export function AutoJoinStatus() {
  const sdk = useSdk()
  const autoJoinState = sdk.store((state) => state.autoJoin)
  const autoJoin = useAutoJoin()
  const userAutoJoin = useAutoJoinForCurrentUser()

  // Don't show component when auto-join is idle or completed
  if (autoJoinState.status === 'idle' || autoJoinState.status === 'succeeded') {
    return null
  }

  const getStatusDisplay = () => {
    switch (autoJoinState.status) {
      case 'pending':
        return {
          icon: '⏳',
          message: 'Joining call automatically...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200'
        }
      case 'retrying':
        return {
          icon: '🔄',
          message: `Retrying connection... (${autoJoinState.attempt}/${autoJoinState.maxAttempts})`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200'
        }
      case 'failed':
        return {
          icon: '⚠️',
          message: 'Auto-join failed. You can join manually.',
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200'
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusDisplay()
  if (!statusInfo) return null

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg border ${statusInfo.bgColor} ${statusInfo.color} max-w-sm`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{statusInfo.icon}</span>
        <div className="flex-1">
          <p className="font-medium text-sm">{statusInfo.message}</p>
          {autoJoinState.lastError && (
            <p className="text-xs opacity-75 mt-1">Error: {autoJoinState.lastError}</p>
          )}
          {userAutoJoin.shouldAutoJoin && (
            <p className="text-xs opacity-75 mt-1">
              Mode: {userAutoJoin.trigger === 'immediate' ? 'Immediate' : 'After first accept'}
            </p>
          )}
        </div>
        {autoJoinState.status === 'failed' && (
          <button
            onClick={() => sdk.join()}
            className="ml-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            Join Manually
          </button>
        )}
      </div>
    </div>
  )
}