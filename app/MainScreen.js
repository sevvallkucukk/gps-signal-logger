import React, { Component } from 'react'

import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    PermissionsAndroid,
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
    // console.log('requestMultiPermission');

    try {
        const permissions = [
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        // console.log(granted);

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
            net: 'network_yok', //2g/3g/4g
            updatesEnabled: false,
            fileName: 'isimiz',
            updateCount: 0,
            data: [],
            modal0: false,
            modal1: false,
            modal2: false,
            logs: 'Uygulama akışı:',
            count: 0
        }
    }

    watchId = null;

    componentDidMount() {
        // console.log('componentDidMount');
        // console.log(PermissionsAndroid.RESULTS.GRANTED)

        // Uygulama açıldığı gibi gerekli izinleri kullanıcıya sorar.
        // requestMultiPermission();

        // console.log('izin istendi ?')
        // this.addLog('izinler istendi')

        this.initializeApp();
    }

    addLog(str){
        this.setState(prevState =>({ logs : prevState.logs + '\n'+Moment().format('HH:mm:ss')+'\t'+str}) );
    }

    requestPerm = async () => {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

            const granted = await PermissionsAndroid.requestMultiple(permissions);

            this.addLog('konum izni '+granted["android.permission.ACCESS_COARSE_LOCATION"]);
            // console.log('granted',granted)

            return granted;

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("izinler verildi");
                resolve(true);
            } else {
                console.log("izinler verilmedi");
                resolve(false)
            }
        } catch (err) {
            console.warn(err);
        }
    }

    initializeApp = async () => {
        console.log('initializeApp')

        // if(PermissionsAndroid.RESULTS.GRANTED != 'granted'){
        //     requestMultiPermission();
        // }

        let promise = new Promise( (resolve,reject) =>{

            resolve ( this.requestPerm() )

        })

        let perms = await promise;

        if(perms["android.permission.READ_PHONE_STATE"] != 'granted')
        {
            this.addLog('izinlerde problem. Lütfen tekrar izinleri verin')
            return;
        }

        // Uygulama açılınca veritabanına telefon imei ile bir kayıt açar.
        TelephonyManager.getPhoneInfo(phone => {
            // telefon imei sonra lazım olur diye STATE içinde kaydedilir.
            this.setState({ imei: phone.imei });
            this.addLog(phone.imei)

            firestore()
                .collection(phone.imei)
                .doc('cihazBilgi')
                .get()
                .then(data => {
                    // console.log('data',data)
                    if (data.exists) {
                        alert('cihaz kayıtlı')
                        this.addLog('cihazınız kayıtlı '+ data._data.imei)
                        return;
                    } else {

                        firestore()
                            .collection(phone.imei)
                            .doc('cihazBilgi')
                            .set({
                                isim: 0,
                                imei: phone.imei,
                                kayitTarihi: Moment().format('YYYY-MM-DD_HH:mm:ss'),
                            })
                            .then(() => {
                                this.addLog('cihazınız kaydedildi '+phone.imei)
                            })
                            .catch(e => this.addLog('hata olustu', e));
                    }
                })
                .then(() => {
                    console.log('Cihaz Kaydedildi');
                })
                .catch(e => this.addLog('hata olustu', e));
        });
    }

    // veritabanından veri okur
    // https://rnfirebase.io/firestore/usage#read-data
    export = async () => {
        this.addLog('Dışa aktarma başlatılıyor');

        let promise = new Promise((resolve, reject) => {
            firestore()
                .collection(this.state.imei)
                .orderBy('isim', 'asc')
                .get()
                .then(data => {
                    const size = data.size;
                    
                    this.addLog("cihazın toplam kayıt sayısı"+data.size);

                    const isim = data.docs[size - 1]._data.isim;
                    this.addLog('dosya ismi alındı '+isim)

                    resolve(isim);
                })
                .catch(e => {
                    reject(e);
                    console.error(e);
                });
        })

        let isim = await promise;

        let promise2 = new Promise((resolve, reject) => {
            firestore()
                .collection(this.state.imei)
                .doc(isim)
                .get()
                .then(d => {
                    let records = d._data.records;
                    // console.log(records)
                    this.addLog('dosyadaki konumlar alındı, toplam:  '+ records.length)
                    resolve(records);
                })
                .catch(e => {
                    reject(e);
                    this.addLog('kayıtlar alınırken hata oldu '+e);
                });
        })

        let records = await promise2;

        // console.log('dosya yazma baslıyor.', records)

        let content = "time,accuracy,latitude,longitude,altitude,network,strength";
        records.forEach(record => {
            content += "\n";
            content += record.time + ',' + record.accuracy + ',' + record.location.latitude + ',' + record.location.longitude + ',' + record.altitude + ',' + record.network + ',' + record.strength;
        });

        Moment.locale('tr');
        const folderPath = RNFS.ExternalStorageDirectoryPath + '/SinyalGucu/';
        
        const filePath = folderPath + isim;

        RNFS.exists(folderPath)
            .then(r => console.log('klasor var ', r))
            .catch(e => console.error('klasor kontrol hatası', e));

        RNFS.mkdir(folderPath)
            .then(r => console.log('klasor acıldı ', r))
            .catch(e => console.log('klasor acma hatası', e));

        RNFS.writeFile(filePath, content, "utf8")
            .then(t => this.addLog('dosyaya yazıldı',t))
            .catch(e => this.addLog('dosayay yazılamadı', e));
    }

    // veritabanına veri kaydeder.
    //https://rnfirebase.io/firestore/usage#adding-documents
    addRecord(record) {
        // console.log(this.state.fileName)
        // console.log(this.state.imei)

        firestore()
            .collection(this.state.imei)
            .doc(this.state.fileName)
            .get()
            .then(data => {
                if (data.exists) {
                    // console.log('dosya varmıs')
                    firestore()
                        .collection(this.state.imei)
                        .doc(this.state.fileName)
                        .update({
                            records: firestore.FieldValue.arrayUnion(record)
                        })
                        .then(i => this.addLog("yeni kayıt veritabanına eklendi "+this.state.str))
                        .catch(e => this.addLog("yeni kayıt esansında hata oldu"+ e));
                }
                else {

                    // console.log('dosya yokmus')
                    firestore()
                        .collection(this.state.imei)
                        .doc(this.state.fileName)
                        .set({
                            isim: this.state.fileName,
                            records: firestore.FieldValue.arrayUnion(record)
                        })
                        .then(i => this.addLog("yeni kayıt veritabanına eklendi "+this.state.str))
                        .catch(e => this.addLog("yeni kayıt esansında hata oldu"+ e));
                }
            })
            .then(i => console.log("kayıt veritabanına eklendi", i))
            .catch(e => console.error("kayıt esansında hata oldu", e));

    }

    // https://github.com/Agontuk/react-native-geolocation-service#watchpositionsuccesscallback-errorcallback-options
    getLocationUpdates = async () => {
        //const hasLocationPermission = await this.hasLocationPermission();

        // if (!hasLocationPermission) {
        //   return;
        // }
        // console.log("getLocationUpdates()")

        const fileName = Moment().format('YYYY-MM-DD_HH.mm.ss') + '.csv';
        this.addLog("Dosya isim belirlendi " + fileName)
        this.addLog(this.state.period + 'sn ile konum alınacak')

        this.setState({ updatesEnabled: true, fileName: fileName })

        this.watchId = Geolocation.watchPosition(
            (position) => {
                // telefon konum bilgilerini verir.
                this.setState({
                    acc: position.coords.accuracy.toFixed(0),
                    alt: position.coords.altitude.toFixed(0),
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });

                let record = {}
                record["accuracy"] = position.coords.accuracy.toFixed(0);
                record["location"] = new firestore.GeoPoint(position.coords.latitude, position.coords.longitude);
                record["altitude"] = position.coords.altitude.toFixed(0);
                record["time"] = Moment(position.timestamp).format('YYYY-MM-DD_HH:mm:ss');

                // telefon ağ isim bilgisini verir. 2g/3g/4g gibi
                TelephonyManager.getNetworkClass((network) => {
                    if (network != null) {
                        record["network"] = network;
                        this.setState({ net: network });
                    }

                    // telefon sinyal bilgilerini verir. ağ tipini verir. LTE/WCDMA/UTMS. sinyal gücü verir 18asu.
                    TelephonyManager.getCellInfo((network) => {

                        // bazen telefon cekmez, bu deger boş dönebilir.
                        if (network[0].cellSignalStrength != null) {

                            const strength = this.convertPercentage(network[0].cellSignalStrength.asuLevel);

                            record["strength"] = strength;
                            record["asuLevel"] = network[0].cellSignalStrength.asuLevel;

                            this.setState({ str: strength });
                        }
                        else{
                            
                            record["strength"] = 0;
                            record["asuLevel"] = 0;

                            this.setState({ str: strength });
                        }

                        this.addRecord(record);

                    });
                });
            },
            (error) => {
                console.log('location err: ', error);
            },
            {
                enableHighAccuracy: true,
                distanceFilter: 0,
                interval: 1000 * this.state.period,
                fastestInterval: 1000 * this.state.period,
                forceRequestLocation: true,
                showLocationDialog: true,
                useSignificantChanges: false,
            },
        );
    }

    // konum alma ve kayıt etmeyi durdurur.
    removeLocationUpdates = () => {
        this.addLog("Konum toplama durdu")
        if (this.watchId !== null) {
            Geolocation.clearWatch(this.watchId);
            Geolocation.stopObserving();
            this.setState({ updatesEnabled: false });
        }
    };

    // sinyal gücünü asu degerinden yüzdelik değere cevirir.
    // 4g icin hesaplama ile diğer ağlar icin yapılan farklıdır.
    convertPercentage(asu) {
        if (this.state.net == '4G') {
            return (((asu - 3) / 92) * 100).toFixed(2);
        } else {
            return ((asu / 32) * 100).toFixed(2);
        }
    }

    saveConfig() {
        this.addLog('yeni period '+ this.state.period)
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
                            <Text style={{ fontSize: 24, fontWeight: '800' }}> SİNYAL GÜCÜ </Text>
                        </View>

                        <View style={styles.row}>
                            <Button title="Ayar Yap" onPress={() => this.setState({ modal0: true })} />
                        </View>
                        <View style={{ marginBottom: 20, width: '100%', height: 40, justifyContent:'center',alignItems:'center', backgroundColor: this.state.updatesEnabled ? 'green' : 'gray' }}>
                            {this.state.updatesEnabled && <Text style={{color:'white',fontWeight:'800',fontSize:18}}>Veri kaydı devam ediyor.</Text>}
                        </View>
                        <View style={styles.row}>
                            <Button
                                onPress={() => this.getLocationUpdates()}
                                title="Başlat"
                            />
                            <Button
                                onPress={() => this.removeLocationUpdates()}
                                title="Bitir"
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
                                title="Dışa Aktar"
                            />
                        </View>
                        <TextInput
                            multiline={true}
                            value={this.state.logs}
                            editable={false}
                            scrollEnabled={true}
                            style={styles.logs}
                        />

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
                                onChangeText={(period) => this.setState({ period: period })}
                                onSubmitEditing={(period) => this.setState({ period: period })}
                                style={styles.inputs}
                                placeholder={"örn. 2"}
                                placeholderTextColor={"#aaa"}
                                maxLength={3}
                                autoCapitalize="none"
                                textContentType="telephoneNumber"
                                returnKeyType="done"
                                keyboardType="number-pad"
                                blurOnSubmit={false}
                            />
                            <Button title="Ayarları Kaydet" onPress={() => this.saveConfig()} />
                            <Button title="İzinleri talep et" onPress={() => requestMultiPermission()} />
                            <Button title="Kapat" onPress={() => this.setState({ modal0: false })} />
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
        height: '40%',
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        flexDirection: 'column',
        alignItems: "center",
        justifyContent: "space-around",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    logs: {
        width:'100%',
        backgroundColor:'#eee',
    }
});