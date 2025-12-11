import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import TextComp from './TextComp';
import FontFamilty from '../../constants/FontFamilty';
import { AppStrings } from '../../constants/AppStrings';


const InfoModal = ({ info, setIsvisible }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

    return (
        <Modal transparent>
            <View style={styles.container}>
                <View style={styles.modalContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}>
                        <TextComp style={{
                            flex: 1,
                            textAlign: 'center',
                            fontFamily: FontFamilty.semibold,
                            color: theme.textPrimary
                        }} size={16} children={AppStrings.info} />

                        <TouchableOpacity onPress={() => setIsvisible(false)} style={styles.closeButton}>
                            <Icon name="close" size={16} color={theme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <TextComp style={styles.textStyle} size={12} children={info} />
                </View>
            </View>
        </Modal>

    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        rowGap: 16,
        justifyContent: 'center'
    },
    modalContent: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'center',
        rowGap: 16
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        alignSelf: 'center',
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 100,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textStyle: {
        fontFamily: FontFamilty.regular,
        color: theme.textSecondary,
    }
});

export default InfoModal;
