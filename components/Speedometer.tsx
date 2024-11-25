// Speedometer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const Speedometer = ({ speed }) => {
    const radius = 40; // Adjusted radius for a smaller gauge
    const strokeWidth = 6; // Reduced stroke width
    const circumference = 2 * Math.PI * radius;
    const speedPercentage = Math.min(speed / 180, 1); // Assuming 180 km/h is the max speed
    const offset = circumference - (speedPercentage * circumference);

    const getColor = () => {
        if (speed < 50) return '#4CAF50'; // Green for low speed
        if (speed < 100) return '#FFEB3B'; // Yellow for moderate speed
        return '#F44336'; // Red for high speed
    };

    return (
        <View style={styles.container}>
            <Svg width="90" height="90">
                <G rotation="-90" origin="45, 45">
                    <Circle
                        stroke="#e0e0e0"
                        fill="transparent"
                        cx="45"
                        cy="45"
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    <Circle
                        stroke={getColor()}
                        fill="transparent"
                        cx="45"
                        cy="45"
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={offset}
                    />
                </G>
            </Svg>
            <Text style={styles.speedText}>{speed.toFixed(0)} km/h</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 20,
        right: 20,
        width: 90,
        height: 90,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    speedText: {
        position: 'absolute',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

// Single default export
export default Speedometer;