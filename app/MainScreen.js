import React, { Component } from 'react'

import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    Button,
    TextInput
} from 'react-native';

import Geolocation from 'react-native-geolocation-service';

export class MainScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            period: 5,
            lat: 30.000,
            lon: 40.000,
            alt: 0,
            acc: 0,
            strength: -60,
            updatesEnabled: false,
            updateCount: 0,
        }
    }

    watchId = null;

    componentDidMount() {
        Geolocation.getCurrentPosition(
            (position) => {
                console.log(position);
                this.setState({
                    acc: position.coords.accuracy,
                    alt: position.coords.altitude,
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                // See error code charts below.
                console.log(error.code, error.message);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    }

    getLocationUpdates = async () => {
        //const hasLocationPermission = await this.hasLocationPermission();

        // if (!hasLocationPermission) {
        //   return;
        // }

        this.setState({ updatesEnabled: true }, () => {
            this.watchId = Geolocation.watchPosition(
                (position) => {
                    this.setState({
                        acc: position.coords.accuracy,
                        alt: position.coords.altitude,
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                    console.log(position);
                },
                (error) => {
                    console.log(error);
                },
                {
                    enableHighAccuracy: true,
                    distanceFilter: 0,
                    interval: 1000 * this.state.period,
                    fastestInterval: 2000,
                    forceRequestLocation: true,
                    showLocationDialog: true,
                    useSignificantChanges: false,
                },
            );
        });
    };

    removeLocationUpdates = () => {
        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            this.setState({ updatesEnabled: false });
        }
    };

    start() {
        alert('kayıt başlıyor');
    }

    stop() {
        alert('kayıt bitiyor');
    }

    saveConfig() {
        alert('kaydettiginiz aralık ' + this.state.period);
    }

    export() {
        alert('export')
    }

    render() {
        return (
            <>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView>
                    <ScrollView
                        contentInsetAdjustmentBehavior="automatic"
                        style={styles.scrollView}>

                        <View style={styles.header}>
                            <Text> GPS SIGNAL LOGGER </Text>
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                value={this.state.period}
                                onChangeText={(period) => this.setState({ period })}
                                style={styles.inputs}
                                placeholder={"örn. 2sn"}
                                placeholderTextColor={"#aaa"}
                                maxLength={3}
                                autoCapitalize="none"
                                textContentType="telephoneNumber"
                                returnKeyType="done"
                                keyboardType="number-pad"
                                blurOnSubmit={false}
                            />
                            <Button
                                onPress={() => this.saveConfig()}
                                title="Ayarları Kaydet"
                            />
                        </View>

                        <View style={styles.row}>
                            <Button
                                onPress={this.getLocationUpdates}
                                title="Başlat"
                            />
                            <Button
                                onPress={this.removeLocationUpdates}
                                title="Bitir"
                            />
                        </View>
                        <View style={styles.row}>
                            <Text>enlem: {this.state.lat} </Text>
                            <Text>boylam: {this.state.lon} </Text>
                        </View>
                        <View style={styles.row}>
                            <Text>sinyal gücü: {this.state.strength} </Text>
                        </View>

                        <View style={styles.row}>
                            <Button
                                onPress={() => this.export()}
                                title="Export"
                            />
                        </View>

                        <View style={styles.row}>
                            <Button
                                onPress={() => this.export()}
                                title="Upload"
                            />
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </>
        )
    }
}

export default MainScreen

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20
    }
});