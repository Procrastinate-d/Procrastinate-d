# Spoiler: mostly from school
import RPi.GPIO as GPIO  # RPi MODULES!!!
import time
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)


# This is connected to the LDR (i'm not sure about others like potentiometer ._.)
# ~900 bright, ~600 room, ~100 dark
def read_ADC_init()
    import spidev  # For the magic ADC converter (MCP3008)
    global my_spi
    my_spi=spidev.SpiDev()
    my_spi.open(0, 0)


def read_ADC():
    my_spi.max_speed_hz=1350000
    r=my_spi.xfer2([1,0b10000000,0])    # [0b10000000 = 128 = 8+0<<4]
    result=((r[1]&3)<<8)+r[2]
    return result


# This is connected to the temperature and humidity sensor, blue. (import dht11) 
# Other module is "Adafruit_DDHT". Initialize: sensor = Adafruit_DHT.AM2302
# humi, temp = Adafruit_DHT.read_retry(sensor, pin)
def read_temp_humidity_init()
    from . import dht11
    global dht11_inst
    dht11_inst = dht11.DHT11(pin=21)  # read data using pin 21


def read_temp_humidity():
    global dht11_inst
    result = dht11_inst.read()
    if result.is_valid():
        return result.temperature, result.humidity
    else:
        return None, None


# print(read_ADC())

# temp, humi = read_temp_humidity()
# print(f'T = {temp:4.1f}°C, H = {humi:5.1f}%')


