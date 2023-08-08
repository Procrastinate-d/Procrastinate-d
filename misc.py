

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


