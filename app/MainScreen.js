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

export class MainScreen extends Component {
    constructor(props) {
        super(props)

        this.state = {
            period: 5,
            lat: 30.000,
            lon: 40.000,
            strength: -60,
        }
    }

    start() {
        alert('kayıt başlıyor');
    }

    stop() {
        alert('kayıt bitiyor');
    }

    saveConfig() {
        alert('kaydettiginiz aralık ' + this.state.period);
    }

    export(){
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
                                onPress={() => this.start()}
                                title="Başlat"
                            />
                            <Button
                                onPress={() => this.stop()}
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