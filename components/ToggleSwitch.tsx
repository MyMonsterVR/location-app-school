import React from "react";
import {StyleSheet, Switch} from "react-native";
import {getItem, setItem} from "@/app/utils/AsyncStorage";

export function ToggleSwitch({Option}: {Option: string}) {
    const [isEnabled, setIsEnabled] = React.useState(false);
    const toggle = () => {
        setIsEnabled(previousState => !previousState);
        setItem(Option, isEnabled);
    }

    console.log(Option)

    return (
        <Switch style={styles.ToggleButton}
                onValueChange={toggle}
                value={isEnabled}
                trackColor={{false: '#767577', true: '#81b0ff'}}
                thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
        />
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ToggleButton: {
        height: 30,
        marginRight: 10,
    },
});
