import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, layout } from '../../theme/spacing';

type TopInset = 'header' | 'safe' | 'none';
type BottomInset = 'tabbar' | 'safe' | 'none';

interface ScreenProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    topInset?: TopInset;
    bottomInset?: BottomInset;
}

/**
 * Minimal screen wrapper to standardize "chrome":
 * - Transparent background so AppBackground can show through
 * - Consistent top padding when using transparent navigation headers
 * - Optional bottom clearance for the tab bar
 */
export const Screen: React.FC<ScreenProps> = ({
    children,
    style,
    topInset = 'header',
    bottomInset = 'none',
}) => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    const paddingTop =
        topInset === 'header'
            ? Math.max(headerHeight, insets.top) + spacing.md
            : topInset === 'safe'
            ? insets.top + spacing.md
            : 0;

    const paddingBottom =
        bottomInset === 'tabbar'
            ? layout.tabBarClearance
            : bottomInset === 'safe'
            ? insets.bottom
            : 0;

    return (
        <View style={[{ flex: 1, backgroundColor: 'transparent', paddingTop, paddingBottom }, style]}>
            {children}
        </View>
    );
};

