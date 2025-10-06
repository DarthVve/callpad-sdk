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
          {/* Caller Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">When You Call Others</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.caller.enabled}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    caller: { ...prev.caller, enabled: e.target.checked }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Auto-join calls when someone accepts</span>
              </label>
              
              {localConfig.caller.enabled && (
                <div className="ml-7 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="callerTrigger"
                      checked={localConfig.caller.trigger === 'first-accept'}
                      onChange={() => setLocalConfig(prev => ({
                        ...prev,
                        caller: { ...prev.caller, trigger: 'first-accept' }
                      }))}
                      className="mr-2 h-3 w-3 text-blue-600"
                    />
                    <span className="text-xs text-gray-600">Join when first person accepts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="callerTrigger"
                      checked={localConfig.caller.trigger === 'manual'}
                      onChange={() => setLocalConfig(prev => ({
                        ...prev,
                        caller: { ...prev.caller, trigger: 'manual' }
                      }))}
                      className="mr-2 h-3 w-3 text-blue-600"
                    />
                    <span className="text-xs text-gray-600">Always join manually</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Callee Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">When Others Call You</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.callee.enabled}
                  onChange={(e) => setLocalConfig(prev => ({
                    ...prev,
                    callee: { ...prev.callee, enabled: e.target.checked }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Auto-join after accepting call</span>
              </label>
              
              {localConfig.callee.enabled && (
                <div className="ml-7 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="calleeTrigger"
                      checked={localConfig.callee.trigger === 'immediate'}
                      onChange={() => setLocalConfig(prev => ({
                        ...prev,
                        callee: { ...prev.callee, trigger: 'immediate' }
                      }))}
                      className="mr-2 h-3 w-3 text-blue-600"
                    />
                    <span className="text-xs text-gray-600">Join immediately after accepting</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="calleeTrigger"
                      checked={localConfig.callee.trigger === 'manual'}
                      onChange={() => setLocalConfig(prev => ({
                        ...prev,
                        callee: { ...prev.callee, trigger: 'manual' }
                      }))}
                      className="mr-2 h-3 w-3 text-blue-600"
                    />
                    <span className="text-xs text-gray-600">Always join manually</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Fallback Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">If Auto-Join Fails</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fallback"
                  checked={localConfig.fallback.onFailure === 'retry'}
                  onChange={() => setLocalConfig(prev => ({
                    ...prev,
                    fallback: { ...prev.fallback, onFailure: 'retry' }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Retry automatically</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="fallback"
                  checked={localConfig.fallback.onFailure === 'manual'}
                  onChange={() => setLocalConfig(prev => ({
                    ...prev,
                    fallback: { ...prev.fallback, onFailure: 'manual' }
                  }))}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Show manual join button</span>
              </label>
              
              {localConfig.fallback.onFailure === 'retry' && (
                <div className="ml-7">
                  <label className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Max retries:</span>
                    <select
                      value={localConfig.fallback.retryAttempts}
                      onChange={(e) => setLocalConfig(prev => ({
                        ...prev,
                        fallback: { ...prev.fallback, retryAttempts: parseInt(e.target.value) }
                      }))}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="5">5</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <strong>Note:</strong> In this demo, settings changes require a page refresh to take effect. 
          In a production app, you would implement dynamic configuration updates.
        </div>
      </div>
    </div>
  )
}