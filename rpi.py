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


# This is connected to a moisture sensor (metallic-looking)
# Waste of space 💀
def read_moist_init()
    GPIO.setup(4,GPIO.IN)  # set GPIO 4 as input
def read_moist()
    return bool(GPIO.input(4))  # 1 = moisture present


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


# This is for an IR sensor
# No lines as well 💀
def read_IR_init():
    GPIO.setup(17,GPIO.IN)  # set GPIO 17 as input
def read_IR():
    return bool(GPIO.input(17)) 


# This is for a slide switch 💀
def read_switch_init():
    GPIO.setup(22,GPIO.IN)  # set GPIO 22 as input
def read_swtich()
    return bool(GPIO.input(22))



# This is for a Servo, 0 to 180°
# (or more, or less, you know how servos are)
# https://www.learnrobotics.org/blog/raspberry-pi-servo-motor/
def set_servo_init():
    GPIO.setup(26, GPIO.OUT)  # set GPIO 26 as output
    servo_PWM = GPIO.PWM(26, 50)  # set 50Hz PWM output at GPIO26


def set_servo(position):
    position = (-10*position)/180 + 12  # formula to rearrange to scale.
    servo_PWM.start(position)  # (see the link above)
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


# LED one line 💀
# 1 or 0. PWM
def set_led_init(pwm):
    GPIO.setup(24, GPIO.OUT)  # set GPIO 24 as output
    if pwm:
        global LED_pwm
        LED_pwm = GPIO.PWM(24, 50)


def set_led(pwm, level):
    if pwm:
        LED_pwm.start(level)
    else:
        GPIO.output(24, level)
    

# Buzzer!
def set_buzzer_init(pwm):
    GPIO.setup(18, GPIO.OUT)  # set GPIO 18 as output
    if pwm:
        global buzz_PWM
        buzz_PWM = GPIO.PWM(18, 50)


def set_buzzer(pwm, level):
    if pwm:
        buzz_PWM.start(level)
    else:
        GPIO.output(18, level)
    

def beep(on, off, times):
    for i in range(times):
        GPIO.output(18, 1)
        time.sleep(on)
        GPIO.output(18, 0)
        time.sleep(off)


# Keypad
# LCD


def all_init():
    read_ADC_init()
    read_temp_humidity_init()
    read_moist_init()
    read_distance_init()
    read_IR()
    read_switch()
    set_servo_init()
    set_motor_init()
    set_led_init(0)
    set_buzzer_init(0)
    

all_init()

# Use Examples:
# using LDR brightness to manipulate buzzer frequency
# using keyboard to select functions like a menu


while True:
    # Place your code here
    # time.sleep(0.2)  # Controlled to limit measurements, or time outputs. Ex: blinking
    
    return 0



# print(f'Light: {read_ADC()}')

# temp, humi = read_temp_humidity()
# print(f'T = {temp:4.1f}°C, H = {humi:5.1f}%')

# print('Moisture Present:', read_moist())

# print(f'Dist = {read_distance():0.1f} cm')

# print('Black/Fire:', read_IR())  # btw im not sure... 0 = blocked
# print('Right side:', read_switch())


# set_servo(90)
# set_motor(100)
# set_led(0, 1)
# set_buzzer(1, 100)



