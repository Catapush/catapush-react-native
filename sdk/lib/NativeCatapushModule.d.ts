/**
 * TurboModule codegen spec for CatapushPluginModule.
 *
 * This file is processed by React Native codegen to generate native bridge
 * interfaces for both iOS (RNCatapushSpec.h) and Android
 * (NativeCatapushModuleSpec.java). Do not rename this file — the generated
 * class names are derived from the filename.
 *
 * Generated output locations (relative to the consuming app build dir):
 *   Android: build/generated/source/codegen/java/com/catapush/reactnative/sdk/NativeCatapushModuleSpec.java
 *   iOS:     build/generated/ios/RNCatapushSpec/RNCatapushSpec.h
 */
import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    addListener(eventName: string): void;
    removeListeners(count: number): void;
    init(appId: string): Promise<boolean>;
    setUser(identifier: string, password: string): Promise<boolean>;
    start(): Promise<boolean>;
    sendMessage(message: Object): Promise<boolean>;
    allMessages(): Promise<Object[]>;
    enableLog(enabled: boolean): Promise<boolean>;
    logout(): Promise<boolean>;
    sendMessageReadNotificationWithId(id: string): Promise<boolean>;
    getAttachmentUrlForMessage(message: Object): Promise<Object>;
    resumeNotifications(): Promise<void>;
    pauseNotifications(): Promise<void>;
    enableNotifications(): Promise<void>;
    disableNotifications(): Promise<void>;
}
declare const _default: Spec;
export default _default;
