import React, { Component } from 'react'

import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar,
    Button,
    TextInput,
    Modal
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
            fileName: 'isimiz',
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
        console.log(Moment().format('YYYY-MM-DD_HH.mm.ss'));

        // Uygulama açıldığı gibi gerekli izinleri kullanıcıya sorar.
        requestMultiPermission;

        // Uygulama açılınca veritabanına telefon imei ile bir kayıt açar.
        TelephonyManager.getPhoneInfo(data => {
            // telefon imei sonra lazım olur diye STATE içinde kaydedilir.
            this.setState({ imei: data.imei });

            firestore()
                .collection(data.imei)
                .doc('cihazBilgi')
                .get()
                .then(data => {
                    if(data.exists){
                        alert('cihaz kayıtlı')
                        return ;
                    }else{
                        
                        firestore()
                        .collection(data.imei)
                        .doc('cihazBilgi')
                        .set({
                            isim: 0,
                            imei: data.imei,
                            kayitTarihi: Moment().format('YYYY-MM-DD_HH:mm:ss'),
                        })
                        .then(() => {
                            alert('Cihaz Kaydedildi')
                            console.log('Cihaz Kaydedildi');
                        })
                        .catch(e => console.log('hata olustu', e));
                    }
                })
                .then(() => {
                    console.log('Cihaz Kaydedildi');
                })
                .catch(e => console.log('hata olustu', e));

            firestore()
                .collection(data.imei)
                .doc('cihazBilgi')
                .set({
                    isim: 0,
                    imei: data.imei,
                    kayitTarihi: Moment().format('YYYY-MM-DD_HH:mm:ss'),
                })
                .then(() => {
                    console.log('Cihaz Kaydedildi');
                })
                .catch(e => console.log('hata olustu', e));
        });
    }


    // veritabanından veri okur
    // https://rnfirebase.io/firestore/usage#read-data
    export = async () => {
        console.log('readRecords()');

        let promise = new Promise((resolve, reject)=>{
            firestore()
                .collection(this.state.imei)
                .orderBy('isim', 'asc')
                .get()
                .then(data => {
                    const size = data.size;
                    console.log("sonuncu:  ", data.docs[size - 1]._data);
                    console.log("getRecords", data.size);
                    
                    const isim = data.docs[size - 1]._data.isim;
                    console.log('isim '+isim)

                    resolve(isim);
                })
                .catch(e => {
                    reject(e);
                    console.error(e);
                });
        })

        let isim = await promise;

        let promise2 =  new Promise( (resolve,reject) =>{
            firestore()
            .collection(this.state.imei)
            .doc(isim)
            .get()
            .then(d => {
                let records = d._data.records;
                console.log(records)
                resolve(records);
            })
            .catch(e => {
                reject(e);
                console.error(e);
            });
        })

        let records = await promise2;

        console.log('dosay yazma baslıyor.',records)

        let content= "time,accuracy,latitude,longitude,altitude,network,stregnth";
        records.forEach(record => {
            content += "\n";
            content += record.time +','+record.accuracy+','+record.location.latitude+','+record.location.longitude+','+record.altitude+','+record.network+','+record.strength;
        });
        console.log('2content: ',content)

        Moment.locale('tr');
        const folderPath = RNFS.ExternalStorageDirectoryPath + '/GPS_Signal_Logger/';
        // const filePath = folderPath + Moment().format('YYYY-MM-DD_HH.mm.ss') + '.csv';
        const filePath = folderPath + isim;

        RNFS.exists(folderPath)
            .then(r => console.log('klasor var ',r))
            .catch(e => console.error('klasor kontrol hatası',e));

        RNFS.mkdir(folderPath)
            .then(r => console.log('klasor acıldı ',r))
            .catch(e => console.log('klasor acma hatası',e));

        RNFS.writeFile(filePath, content, "utf8")
            .then(t => console.log('dosayaya yazıldı', t))
            .catch(e => console.log('dosayay yazılamadı',e));
    }

    // veritabanına veri kaydeder.
    //https://rnfirebase.io/firestore/usage#adding-documents
    addRecord(record) {
        console.log('addRecord()', this.state.fileName);
        console.log('addRecord()', record);

        firestore()
            .collection(this.state.imei)
            .doc(this.state.fileName)
            .get()
            .then(data => {
                if(data.exists){
                    console.log('dosya varmıs')
                    firestore()
                    .collection(this.state.imei)
                    .doc(this.state.fileName)
                    .update({
                        records: firestore.FieldValue.arrayUnion(record)
                    })
                    .then(i => console.log("UPDATE kayıt veritabanına eklendi", i))
                    .catch(e => console.error("UPDATE kayıt esansında hata oldu", e));
                }
                else{
                    
                    console.log('dosya yokmus')
                    firestore()
                    .collection(this.state.imei)
                    .doc(this.state.fileName)
                    .set({
                        isim: this.state.fileName,
                        records: firestore.FieldValue.arrayUnion(record)
                    })
                    .then(i => console.log("ADD kayıt veritabanına eklendi", i))
                    .catch(e => console.error("ADD kayıt esansında hata oldu", e));
                }
            })
            .then(i => console.log("kayıt veritabanına eklendi", i))
            .catch(e => console.error("kayıt esansında hata oldu", e));

        // firestore()
        //     .collection(this.state.imei)
        //     .doc(this.state.fileName)
        //     .set({
        //         records: firestore.FieldValue.arrayUnion(record)
        //     })
        //     .then(i => console.log("kayıt veritabanına eklendi", i))
        //     .catch(e => console.error("kayıt esansında hata oldu", e));
    }

    // https://github.com/Agontuk/react-native-geolocation-service#watchpositionsuccesscallback-errorcallback-options
    getLocationUpdates = async () => {
        //const hasLocationPermission = await this.hasLocationPermission();

        // if (!hasLocationPermission) {
        //   return;
        // }
        console.log("getLocationUpdates()")

        const fileName = Moment().format('YYYY-MM-DD_HH.mm.ss') + '.csv';
        console.log("DOSYA siim verildi  \t"+fileName)

        this.setState({ updatesEnabled: true, fileName: fileName })

        this.watchId = Geolocation.watchPosition(
            (position) => {
                // telefon konum bilgilerini verir.
                this.setState({
                    acc: position.coords.accuracy,
                    alt: position.coords.altitude,
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                console.log("postion: ", position);

                let record = {}
                record["accuracy"] = position.coords.accuracy;
                record["location"] = new firestore.GeoPoint(position.coords.latitude, position.coords.longitude);
                record["altitude"] = position.coords.altitude;
                record["time"] = Moment(position.timestamp).format('YYYY-MM-DD_HH:mm:ss');

                // telefon ağ isim bilgisini verir. 2g/3g/4g gibi
                TelephonyManager.getNetworkClass((network) => {
                    if (network != null) {
                        console.log("ağ tipi: ", network);
                        record["network"] = network;
                        this.setState({ net: network });
                    }

                    // telefon sinyal bilgilerini verir. ağ tipini verir. LTE/WCDMA/UTMS. sinyal gücü verir 18asu.
                    TelephonyManager.getCellInfo((network) => {

                        //bazen telefon cekmez bu değer bos döner.
                        if (network[0].connectionType = ! null) {
                            record["type"] = network[0].connectionType;
                            console.log("connectionType \t" + network[0].connectionType);
                            this.setState({ typ: network[0].connectionType });
                        } else {
                            record["type"] = "no_signal";
                            console.log("telefon cekmiyor");
                        }

                        // bazen telefon cekmez, bu deger boş dönebilir.
                        if (network[0].cellSignalStrength.asuLevel) {

                            const strength = this.convertPercentage(network[0].cellSignalStrength.asuLevel);

                            record["strength"] = strength;
                            record["asuLevel"] = network[0].cellSignalStrength.asuLevel;

                            this.setState({ str: strength });

                            console.log("asuLevel \t" + network[0].cellSignalStrength.asuLevel);
                            console.log("strength \t" + strength);
                        }


                        console.log('record: ', record);

                        this.addRecord(record);

                    });


                });




                //this.readRecords();

            },
            (error) => {
                console.log('location err: ', error);
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
    }

    // konum alma ve kayıt etmeyi durdurur.
    removeLocationUpdates = () => {
        console.log("removeLocationUpdates()")
        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            Geolocation.stopObserving();
            this.setState({ updatesEnabled: false });
        }
    };

    // sinyal gücünü asu degerinden yüzdelik değere cevirir.
    // 4g icin hesaplama ile diğer ağlar icin yapılan farklıdır.
    convertPercentage(asu) {
        console.log('convert')
        console.log(this.state.net);
        if (this.state.net == '4G') {
            return (((asu - 3) / 92) * 100).toFixed(2);
        } else {
            return ((asu / 32) * 100).toFixed(2);
        }
    }

    saveConfig() {
        console.log('saveConfig()')
        this.setState({ modal0: false })
    }

    render() {
        return (
            <>
                <SafeAreaView>
                    <ScrollView
                        contentInsetAdjustmentBehavior="automatic"
                        style={styles.scrollView}>

                        <View style={styles.header}>
                            <Text> SİNYAL GÜCÜ </Text>
                        </View>

                        <View style={styles.row}>

                            <Button title="config" onPress={() => this.setState({ modal0: true })} />

                        </View>
                        <View style={styles.row}>
                            <Button
                                onPress={() => this.getLocationUpdates()}
                                title="Başlat"
                                color={this.state.updatesEnabled ? 'green' : 'blue'}
                            />
                            <Button
                                onPress={() => this.removeLocationUpdates()}
                                title="Bitir"
                                color={this.state.updatesEnabled ? 'blue' : 'green'}
                            />
                        </View>

                        <View style={styles.row}>
                            <Text>enlem: {this.state.lat} </Text>
                            <Text>boylam: {this.state.lon} </Text>
                        </View>

                        <View style={styles.row}>
                            <Text>ağ tipi: {this.state.net} </Text>
                            <Text>sinyal gücü: {this.state.str} </Text>
                        </View>

                        <View style={styles.row}>
                            <Button
                                onPress={() => this.export()}
                                title="Export"
                            />
                        </View>

                    </ScrollView>
                </SafeAreaView>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.modal0}
                    onRequestClose={() => this.setState({ modal0: false })}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
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
                            <Button title="Ayarları Kaydet" onPress={() => this.saveConfig()} />
                            <Button title="close" onPress={() => this.setState({ modal0: false })} />
                        </View>
                    </View>
                </Modal>

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
    },
    column: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginBottom: 20
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#333e'
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
});