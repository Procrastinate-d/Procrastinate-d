# (OutlookSteak.html)
# Forwards emails in folders [Custom version: filtering]
startAt = None         # String title to start at (untested w/ filters)
keep_skipping = True  
test_over = True       # Set to true if no testing needed
port = "8989"          # ._.
Selectfolder = ""      # Folder name
SelectFolders = None   # If choosing more than one folder, use this.
SelectFolders = []
# + Create profile folders and edit them below
toEmail = "YOUR VALID EMAIL HERE" # Target Email
print('Absolutely no drafts (in folder) or meeting requests in your emails please!')
print('Please run such that the folder sidebar on the left is always visible.')
# Working since 31 Mar 2025

# It will not work if you use a wrong folder name. 
# It may get stuck so help it along pls :)

filter_on = True
last_N_emails = 3   # at the top
first_N_emails = 3  # at the bottom (how)
monthly = True      


from datetime import datetime as dt
from calendar import monthrange, isleap
from time import sleep
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver import Keys, ActionChains
# hell https://stackoverflow.com/questions/22859050/show-current-cursor-position-in-selenium

from selenium import __version__ as selVer
print("Selenium:", selVer) # 4.31.1

application = "Firefox"
if application == "Chrome":
    # oldpwd = os.getcwd()  # original directory where the script is in?
    fullstr = r'C:\Program Files\Google\Chrome\Application\chrome.exe --remote-debugging-port='+port+r' --user-data-dir="C:\Users\123fr\Documents\Backup_Files\newPythonScripts\somescript\MyProfile"'
    # os.system(fullstr)  # space is being interpreted as %20 even with "" 😡
    subprocess.Popen(fullstr)  # run / call blocks the following from running. zombies? 'u' what zombies?
    options = webdriver.ChromeOptions()
    options.add_experimental_option("debuggerAddress", "localhost:"+port)
    driver = webdriver.Chrome(options=options)
elif application == "Firefox":
    options = webdriver.FirefoxOptions()
    # options.add_argument('-start-debugger-server')
    # options.add_argument(port)
    options.add_argument('-profile')
    options.add_argument(r'C:\Users\123fr\Documents\Backup_Files\newPythonScripts\somescript\MyProfileFirefox')
    options.set_preference("remote.events.async.enabled", False) # # holy guacamole https://stackoverflow.com/questions/79422114/javascriptexception-cyclic-object-value-with-python-selenium-actionchains-afte
    driver = webdriver.Firefox(options=options)

driver.get("https://outlook.office.com/mail/")

# Wait for page to load
delay = 30 # seconds
try:
    myElem = WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.ID, 'topSearchInput')))
    sleep(2)
except TimeoutException:
    print("Time out")
    exit()
# Open all folders. Select folder (please don't have same name folders)

def offsetMove(x, y):
    actionChain = ActionBuilder(driver)
    actionChain.pointer_action.move_to_location(x, y)
    actionChain.pointer_action.click()
    actionChain.perform()
# https://stackoverflow.com/questions/14049983/selenium-webdriver-finding-an-element-in-a-sub-element
def shrinkTheEmails():
    WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-app-section*="ConversationContainer"] div[aria-expanded]')))
    e = driver.find_elements(By.CSS_SELECTOR, 'div[data-app-section*="ConversationContainer"] div[aria-expanded="true"] > div')
    
    for i in range(len(e)):
        # Most. Annoying. Error. selenium.common.exceptions.MoveTargetOutOfBoundsException: Message: Move target (914, 655) is out of bounds of viewport dimensions (1190, 601)
        target = e[i].find_elements(By.CSS_SELECTOR, 'div[aria-label="Email message"] div[class*="uSg02"]') # call twice???
        if len(target) > 0:
            driver.execute_script("arguments[0].scrollIntoView(true);", target[0])

        target = e[i].find_elements(By.CSS_SELECTOR, 'div[aria-label="Email message"] div[class*="uSg02"]')  # get rid of >
        # target = e[i].find_elements(By.CSS_SELECTOR, 'div[aria-label="Email message"] div[class*="x9jfA"]')  
        if len(target) > 0:
            x, y, w, h = target[0].location['x'], target[0].location['y'], target[0].size['width'], target[0].size['height']
            # XDif, YDif = -(w/2)+5, -(h/2)+5 
            # https://stackoverflow.com/questions/65790737/how-to-get-screen-coordinate-of-a-element-in-selenium-python
            if len((e[i].find_elements(By.CSS_SELECTOR, "#focused"))) == 0: # OK! IF THE THING IS NOT FOCUSED, YOU NEED TO CLICK ANOTHER TIME.
                ActionChains(driver).move_to_element(target[0]).perform()    
                # ActionChains(driver).move_by_offset(XDif, YDif).click().perform() # PLEASE DO NOT ZOOM IN
                offsetMove(x+5, y+5)
                # target[0].click()
                # input('focused!')
                # sleep(2)
            # ActionChains(driver).context_click().perform()
            # input('hey')
            
            ActionChains(driver).move_to_element(target[0]).perform()
            offsetMove(x+5, y+5)


            # driver.execute_script("arguments[0].click()", target[0])
            # input()
        else:  # This is the "message history" at the stop of the chain
            # print('no target :(', e[i].get_attribute("class"))
            hidemsghistory = e[i].find_elements(By.CSS_SELECTOR, 'button[data-is-focusable="true"]')
            if len(hidemsghistory) > 0: hidemsghistory[0].click()  #index should be 0...

def findParent(el, recur=1):
    immediateParent = el.find_element(By.XPATH, "parent::*")
    if recur > 1:
        return findParent(immediateParent, recur-1)
    return immediateParent

def asyncOne():
    shrinkTheEmails()
    sleep(0.2) # your requirements may vary
    skip_forwarding = False
    shorts = driver.find_elements(By.CSS_SELECTOR, "#ConversationReadingPaneContainer div._nzWz")
    txt = shorts[len(shorts)-1]
    if (txt.get_attribute("innerHTML") == "(No message text)"):
        txt.click()
        e = driver.find_elements(By.CSS_SELECTOR, 'div[aria-expanded="true"] label[class="JRNiE WOwiK"]')
        for i in range(len(e)):
            if (e[i].get_attribute("innerHTML") == "To:"):
                emails = driver.find_elements(By.CSS_SELECTOR, 'div[aria-expanded="true"] div[data-testid="RecipientWell"] span[aria-hidden="true"] > span[class*="pU1YL"]')
                for i2 in range(len(e)):
                    # print(findParent(e[i], 2), findParent(emails[i2], 4))
                    if findParent(e[i], 2) == findParent(emails[i2], 4):
                        # print('match', emails[i].get_attribute("innerHTML"))
                        if (emails[i].get_attribute("innerHTML") == toEmail):
                            skip_forwarding = True
                            break
            break
    if (skip_forwarding): return True
    return False

def asyncTwo():
    shrinkTheEmails()
    sleep(0.2)
    dates = driver.find_elements(By.CSS_SELECTOR, "#ConversationReadingPaneContainer div.NNlvm")
    # print(dates)
    dates[len(dates)-1].click()
    sleep(0.1)
    btn = driver.find_elements(By.CSS_SELECTOR, 'div[aria-expanded="true"] div[aria-label="Message actions"] button[aria-label="Forward"]')
    if (len(btn) > 0): 
        btn[0].click()
    else:  
        btn = driver.find_elements(By.CSS_SELECTOR, 'div[aria-expanded="true"] div[aria-label="Message actions"] button[aria-label="More actions"]')
        btn[0].click()
        WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div[class*="ms-Callout"] button > div > span'))) # To play it safe, go full screen :)
        e = driver.find_elements(By.CSS_SELECTOR, 'div[class*="ms-Callout"] button > div > span')
        for i in range(len(e)): 
            if (e[i].get_attribute("innerHTML") == "Forward"):

                # the annoying forward button can cover it.
                e[i].click()
                break    

unusedscript = """
var scrollbar = document.querySelectorAll('#MailList div[class*="customScrollBar"]')[0];
var rect = scrollbar.getBoundingClientRect();
var x = Math.round(rect.right); var y = Math.round(rect.top); // var y = Math.round(rect.bottom -11.58); 
scrollbar.focus();
return [x, y]; """
def scrollbarClick():
    # (x, y) = driver.execute_script(unusedscript)
    # x, y = t[0], t[1]
    # scrollbar = driver.find_element(By.CSS_SELECTOR, '#MailList')
    # scrollbar = driver.find_elements(By.CSS_SELECTOR,'#MailList div[class*="customScrollBar"]')
    # scrollbar[0].click()
    # https://stackoverflow.com/questions/73632962/python-selenium-x-and-y-offset-of-element-to-click-on
    # scrollbar = driver.find_elements(By.CSS_SELECTOR,'#MailList div[class*="customScrollBar"]')
    # actionChains = ActionChains(driver).move_to_element_with_offset(scrollbar[0], 5,5).click().perform()
    # actionChains = ActionBuilder(driver)  # CYLICAL OBJECT ERROR?!?!
    # actionChains.pointer_action.move_to_location(x-5, y+5)
    # print(x, y)
    # actionChains.pointer_action.click()
    # actionChains.perform()
    els = driver.find_elements(By.CSS_SELECTOR, '#MailList div[aria-selected="true"]')
    if len(els) < 1: # none selected currently. choose the first one in the list
        els = driver.find_elements(By.CSS_SELECTOR, '#MailList div[aria-selected="false"]')
        if len(els) > 0: els[0].click()
        else: print("no mails")
    else:  #click the one selected
        els[0].click()
    sleep(0.1)


if SelectFolders is None:
    SelectFolders = [Selectfolder]
for Selectfolder in SelectFolders:
    print('Next folder:', Selectfolder)
    elevator = [Keys.ARROW_UP, Keys.ARROW_DOWN]
    backwards_counting = None # upwards
    forwards_counting = 0

    script = """

    while (true){
        var e = document.querySelectorAll('#mainApp [aria-label="Navigation pane"] div[draggable="true"] button');
        var click_count = 0;
        for (let i = 0; i < e.length; i++){
            if (e[i].parentNode.parentNode.getAttribute("aria-expanded") == "false"){ 
                e[i].click(); click_count += 1; 
            }
        }
        if (click_count == 0){ break; }  // no more to unfold
    }

    var folders = document.querySelectorAll('div[aria-labelledby*="primaryMailboxRoot"] div[draggable="true"] > div[title] > span[class]:not([class="screenReaderOnly"])');
    for (let i = 0; i < folders.length; i++){ 
        if (\""""+Selectfolder+"""\" == folders[i].innerHTML){
            window.console.log(folders[i].innerHTML);
            folders[i].click(); break; }
    }
    """
    
    driver.execute_script(script)
    sleep(0.6)
    # Go through each email and forward
    # (This will read all emails)
    scrollbarClick()
    ActionChains(driver).send_keys(elevator[0]).perform() # If it gets stuck just open the top email (since this ran before the emails loaded)                                              
    # folds then reads the time on the selected email
    # i didn't check what happens to drafts... so please don't have any
    waiting = WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, '#MainModule div[data-app-section="MessageList"] div[aria-label="Message list"]')))
    prevEl = waiting.get_attribute('aria-activedescendant') or None
    # there's an async   https://stackoverflow.com/questions/65695882/execute-javascript-async-function-and-return-result-in-selenium

    e = driver.find_elements(By.CSS_SELECTOR, 'div[data-app-section="NotificationPane"] button[title="Close"]')  # Close the annoying forward
    if len(e)>0: e[0].click()
    while (True):
        sleep(0.2)
        if True:
            msgs = WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, '#ConversationReadingPaneContainer div[aria-expanded]')))
            canSkip = False  # It should not expand the emails

            if (startAt is not None and keep_skipping):
                titleTxt = driver.find_elements(By.CSS_SELECTOR, '#ConversationReadingPaneContainer [data-app-section="ConversationContainer"] div span')[0].get_attribute("innerHTML")
                if titleTxt == startAt:
                    keep_skipping = False
                    print('Starting now ', titleTxt)
                if keep_skipping: 
                    canSkip = True

            if filter_on:
                # Specific use case: filter specific email format ending with date
                if monthly:
                    titleTxt = driver.find_elements(By.CSS_SELECTOR, '#ConversationReadingPaneContainer [data-app-section="ConversationContainer"] div span')[0].get_attribute("innerHTML")
                    try:
                        myTitle = titleTxt[-10:] 
                        print(myTitle)
                        myDate = dt.strptime(myTitle, '%Y-%m-%d') 
                        if (myDate.day >= (monthrange(year=myDate.year, month=myDate.month)[1] -2)): # last 2 days of each month
                            canSkip = False
                        else:
                            canSkip = True
                        print(canSkip)
                    except Exception as e:
                        print("Error", e)
                
                # Priority
                if backwards_counting is not None:  # Only after you reach the end.
                    shrinkTheEmails()
                    backwards_counting += 1
                    if backwards_counting > first_N_emails : 
                        print('---back break---')
                        break
                    print(backwards_counting, first_N_emails)
                    canSkip = False
                if (last_N_emails > 0):
                    forwards_counting += 1
                    if forwards_counting <= last_N_emails: 
                        print(forwards_counting, last_N_emails)
                        canSkip = False


            if not canSkip:
                e = driver.find_elements(By.CSS_SELECTOR, '#ConversationReadingPaneContainer button[aria-label="Collapse header"]') # Close the txt header
                if len(e)>0: e[0].click()

                canSkip = asyncOne()        # It should expand the emails
            # thethingstoppingitfromarchiving = driver.find_elements(By.CSS_SELECTOR, '#ConversationReadingPaneContainer div[role="heading"] span' )[0]
            # thethingstoppingitfromarchiving.click()
            # print('Can Skip', canSkip)

            if not canSkip:
                driver.find_elements(By.CSS_SELECTOR, '#ConversationReadingPaneContainer [data-app-section="ConversationContainer"] div')[0]
                btn = asyncTwo()
                sendwait = WebDriverWait(driver, delay).until(EC.presence_of_element_located(((By.CSS_SELECTOR, '#ReadingPaneContainerId div[data-testid="ComposeSendButton"] button[aria-label="Send"]' ))))
                ActionChains(driver).send_keys(toEmail).perform()
                sleep(0.2)
                ActionChains(driver).send_keys(Keys.ENTER).perform()
                to = WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div[aria-label="To"]  > span > span > span > span')))
                if to.get_attribute("innerHTML") != toEmail: 
                    input('please verify email: '+ str(to.get_attribute("innerHTML")))
                if not test_over:
                    Send = input('Send? ')
                    if Send.lower() in ["y", "yes"]: # it may not work once directly after
                        send = driver.find_elements(By.CSS_SELECTOR, '#ReadingPaneContainerId div[data-testid="ComposeSendButton"] button[aria-label="Send"]' )[0]
                        send.click()
                    if Send.lower() in ["test over"]: test_over = True
                else:
                    send = driver.find_elements(By.CSS_SELECTOR, '#ReadingPaneContainerId div[data-testid="ComposeSendButton"] button[aria-label="Send"]' )[0]
                    send.click()

            # actionChains.context_click(element).perform()
                sleep(0.1)
        
        scrollbarClick()
        ActionChains(driver).send_keys(elevator[1]).perform()
        sleep(0.1)
        waiting = WebDriverWait(driver, delay).until(EC.presence_of_element_located((By.CSS_SELECTOR, '#MainModule div[data-app-section="MessageList"] div[aria-label="Message list"]')))
        nowEl = waiting.get_attribute('aria-activedescendant')
        
        # print(nowEl, prevEl)
        if (nowEl == prevEl): 
            if filter_on and (first_N_emails is not None and first_N_emails > 0):
                prevEl = None # Start going backwards
                tmp = elevator[0]; elevator[0] = elevator[1]; elevator[1] = tmp  # i do not know a more elegant way
                backwards_counting = 0
                # shrinkTheEmails() # doesn't work
            else:
                print("---next---")
                break
        else:
            prevEl = nowEl

input("📌 You have reached your destination.\n")
driver.close()
