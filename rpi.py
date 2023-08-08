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
    r=my_spi.xfer2([1,0b10000000,0])  # [0b10000000 = 128 = 8+0<<4]
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


# This is connected to an Ultrasonic Sensor
# Requires import time
def read_distance_init():
    GPIO.setup(25, GPIO.OUT)  # GPIO25 as Trig
    GPIO.setup(27, GPIO.IN)  # GPIO27 as Echo


def read_distance():
    GPIO.output(25,1)  # produce a 10us pulse at Trig
    time.sleep(0.00001)
    GPIO.output(25,0)
    
    start = time.time()  # measure pulse width (i.e. time of flight) at Echo
    stop = time.time()
    while GPIO.input(27)==0:
        start = time.time()  # capture start of high pulse
    while GPIO.input(27)==1:
        stop = time.time()  # capture end of high pulse

    distance = (stop - start)*34300/2  # compute distance (cm) = time*speed of ultrasound, /2 from echo
    return distance


# This is for a Servo, 0 to 180°
# (or more, or less, you know how servos are)
def set_servo_init():
    GPIO.setup(26, GPIO.OUT)  # set GPIO 26 as output


def set_servo(position):
    servo_PWM = GPIO.PWM(26, 50)  # set 50Hz PWM output at GPIO26
    position = (-10*position)/180 + 12  # formula to rearrange to scale.
    servo_PWM.start(position)  # (it sets duty cycle to position)
    sleep(0.05)


# This is for a DC Motor
# which is mostly useless because its glued to the board, lying, blocked by being in the middle
def set_motor_init():
    global motor_PWM
    GPIO.setup(23,GPIO.OUT) #set GPIO 23 as output
    motor_PWM = GPIO.PWM(23, 100)  # GPIO23 set frequency (up to you...)


def set_motor(speed):
    if 0 <= speed <= 100:
        PWM.start(speed)



def all_init():
    read_ADC_init()
    read_temp_humidity_init()
    read_distance_init():
    set_servo_init()
    set_motor_init()


all_init()


while True:
    # Place your code here
    return 0


# print(f'Light: {read_ADC()}')

# temp, humi = read_temp_humidity()
# print(f'T = {temp:4.1f}°C, H = {humi:5.1f}%')

# print(f'Dist = {read_distance():0.1f} cm')

# set_servo(90)
# set_motor(100)
