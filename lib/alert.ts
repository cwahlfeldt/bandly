import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Cross-platform alert function that works on web and mobile.
 * On mobile, uses React Native's Alert.alert()
 * On web, uses browser's confirm/alert with proper styling
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    // Web implementation using browser's native dialogs
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length === 0) {
      // Simple alert with OK button
      window.alert(fullMessage);
    } else if (buttons.length === 1) {
      // Single button - just show alert and call handler
      window.alert(fullMessage);
      buttons[0].onPress?.();
    } else {
      // Multiple buttons - use confirm dialog
      // Show cancel button (first) vs action button (second)
      const result = window.confirm(fullMessage);
      if (result && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!result && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // Mobile implementation - use React Native Alert
    Alert.alert(title, message, buttons);
  }
}

/**
 * Simple error alert - convenience function
 */
export function showError(title: string, message: string): void {
  showAlert(title, message, [{ text: 'OK' }]);
}

/**
 * Confirmation dialog - convenience function
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  showAlert(title, message, [
    { text: 'Cancel', onPress: onCancel, style: 'cancel' },
    { text: 'OK', onPress: onConfirm },
  ]);
}
