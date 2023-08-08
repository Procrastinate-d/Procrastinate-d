# Character counter: basically Ctrl+F
def char_count():
	char = input("Character: ")
	text = input("Text: ")
	count = 0
	temp = 0
	temp2 = len(char)
	while True:
	    temp = text.find(char)
	    if temp >= 0:
	        count += 1
	    elif temp == -1:
	        break
	    text = text[:temp] + " " + text[temp + temp2:]
	print(count)


# Colored Text!
def print_color():
	count = 0
	while True:
	    string = "\033[100;{help}m Color Test"
	    print(string.format(help=count))
	    count += 1
	    if count > 100:
	        break
	    elif count == 50:
	        print("^50----------------------------------------------")


# Wipes folders based on list. Ex: ['./folder1/suspicious', './folder2/secret']
def wipe_folder(_paths):  # list. 
  for _path in _paths:
  	if not os.path.exists(_path):
  		os.makedirs(_path)
  	else:
  		files = glob.glob(f'{_path}/*')
  		for f in files:
  			os.remove(f)  # depending on OS, may not allow
  		print('Removed:', _path)


# Synced to every X seconds... to run a program
def simulate_millis(interval):
	from time import sleep, strftime

	while int(strftime('%S'))%interval != 0:
		sleep(0.1)

	time_now = 0
	while True:
		time_then = int(strftime('%S'))
		# Insert Action here

		delay = True
		while delay:
			sleep(0.1)  # i'm lazy
			time_now = int(strftime('%S'))

			if time_now < time_then:  # Case: 0 - 55
				time_now += 60
			if time_now - time_then < interval:  # Case: 54 - 50 < 5
				delay = True
			else:  # Case: 55 - 50 = 5
				delay = False

		print(strftime("%d_%m_%Y-%H_%M_%S"))  # Test print


# Creates new txt files (action can be replaced), but limits number of files by deleting old ones.
def scroll_through(limit):  # limit is the number of files
	from random import randint
	from time import sleep
	import os

	os.system('del test_scroll_files')  # please enter Y
	# WARNING: will remove folder name "test_scroll_files"
	# os.rmdir('./test_scroll_files') won't work because it is not empty (OSError)
	# os.system('rm -rf ./test_scroll_files') windows?

	scroll = []
	count = 0

	while True:
		created = randint(0, 10)
		if len(scroll) > limit-1:
			deleted = scroll.pop(0)
			os.remove(f'./test_scroll_files/file-{count-limit}-{deleted}.txt')
		scroll.append(created)
		print(scroll, '\n')

		# print(os.listdir('.'))
		if not os.path.exists('./test_scroll_files'):
			os.makedirs('./test_scroll_files')
		with open(f'./test_scroll_files/file-{count}-{created}.txt', 'a'):
			pass

		sleep(1.5)
		count += 1


# Draws a grid on an image
def draw_grid()
	from PIL import Image, ImageDraw
	# import pyautogui
	# pyautogui.screenshot('Hello.png')
	im = Image.open('Hello.png')  # Modify
	print(im.size)
	im = im.crop((0, 0, 1920, 1080))  # Custom Crop
	
	draw = ImageDraw.Draw(im)
	GX = 50  # int(input('Factor X: '))
	GY = 100  # int(input('Factor Y: '))
	t6 = []
	t5 = 0
	while GX * t5 <= list(im.size)[1]:
	    t6 += [GX * t5]
	    t5 += 1
	for x in t6:
	    draw.line((0, x, im.size[0], x), fill=(255, 255, 0))  # yellow, horizontal
	t6 = []
	t5 = 0
	while GY * t5 <= list(im.size)[0]:
	    t6 += [GY * t5]
	    t5 += 1
	for y in t6:
	    draw.line((y, 0, y, im.size[1]), fill=(0, 255, 255))  # cyan, vertical
	
	im.save('Hello2.png')  # Output
	im.close()
