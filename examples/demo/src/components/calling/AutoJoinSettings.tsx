import { useState } from 'react'
import { useAutoJoin } from 'vg-x07df'

interface AutoJoinSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function AutoJoinSettings({ isOpen, onClose }: AutoJoinSettingsProps) {
  const autoJoin = useAutoJoin()
  const [localConfig, setLocalConfig] = useState(autoJoin.config)

  if (!isOpen) return null

  const handleSave = () => {
    // Note: In a real app, you'd need to recreate the RtcProvider with new config
    // For demo purposes, we'll just close the modal
    console.log('Auto-join configuration would be saved:', localConfig)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Auto-Join Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Auto-Join Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Auto-Join Configuration</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.enabled}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    enabled: e.target.checked
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Enable auto-join</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.retryOnFailure}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    retryOnFailure: e.target.checked
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                  disabled={!localConfig.enabled}
                />
                <span className="text-sm text-gray-700">Retry on failure</span>
              </label>

              <div className="space-y-2">
                <label className="block text-sm text-gray-700">
                  Max retries: {localConfig.maxRetries}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={localConfig.maxRetries}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value)
                  }))}
                  className="w-full"
                  disabled={!localConfig.enabled || !localConfig.retryOnFailure}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}