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
import firestore from '@react-native-firebase/firestore';
import RNFS from 'react-native-fs';
import Moment from 'moment';

// telefon sinyallerini android içinden alır.
const TelephonyModule = require('react-native-telephony-manager');
const TelephonyManager = TelephonyModule.default;

// Uygulama baslayınca izinleri talep eder.
// https://reactnative.dev/docs/permissionsandroid
const requestMultiPermission = async () => {
    console.log('requestMultiPermission');

    try {
        const permissions = [
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        console.log(granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("izinler verildi");
        } else {
            console.log("izinler verilmedi");
        }
    } catch (err) {
        console.warn(err);
    }
};

export class MainScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            imei: 'imei_yok',
            period: 5,
            lat: 0.00,
            lon: 0.00,
            alt: 0,
            acc: 0,
            str: 0,
            typ: 'type_yok',    //LTE,WCDMA
            net: 'network_yok', //2g/3g/4g
            updatesEnabled: false,
            updateCount: 0,
            data: [],
            modal0: false,
            modal1: false,
            modal2: false,
        }
    }

    watchId = null;

    componentDidMount() {
        console.log('componentDidMount');

        // Uygulama açıldığı gibi gerekli izinleri kullanıcıya sorar.
        requestMultiPermission;

        // Uygulama açılınca veritabanına telefon imei ile bir kayıt açar.
        TelephonyManager.getPhoneInfo(data => {
            // telefon imei sonra lazım olur diye STATE içinde kaydedilir.
            this.setState({ imei: data.imei });

            firestore()
                .collection(data.imei)
                .doc('cihazBilgi')
                .set({
                    isim: 0,
                    imei: data.imei,
                    kayitTarihi: Moment().format('YYYY-MM-DD_HH:MM:SS'),
                })
                .then(() => {
                    console.log('Cihaz Kaydedildi');
                })
                .catch(e => console.log('hata olustu', e));
        });
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
                    distanceFilter: 10,
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