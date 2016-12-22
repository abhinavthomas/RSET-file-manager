
from multiprocessing import Process
import os
from getpass import getpass

def func1(usrn,passw):
  string = 'node bin/cloudcmd.js -u '+usrn+' -p '+ passw + ' --root ../files'
  os.system(string)

def func2():
  os.system('node ./lib/index.js -d ../files/upload')

if __name__ == '__main__':

  os.chdir('admin')
  os.system('npm install')
  os.system('npm run build')
  usern = raw_input("Enter your admin user name : ")
  passw = getpass("Enter your admin password: ")
  p1 = Process(target=func1, args=(usern,passw))
  p1.start() 
  os.chdir('../file_man')
  os.system('npm install')
  p2 = Process(target=func2)
  p2.start()
  p1.join()
  p2.join()