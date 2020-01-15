from setuptools import setup

from __future__ import absolute_import
from __future__ import print_function

import subprocess
from distutils.command.build import build as _build  # type: ignore
#sudo apt-get install unixodbc-dev
#pyodbc
CUSTOM_COMMANDS = [
    ['apt-get', 'install', 'unixodbc-dev']]

class CustomCommands(setuptools.Command):
  """A setuptools Command class able to run arbitrary commands."""

  def initialize_options(self):
    pass

  def finalize_options(self):
    pass

  def RunCustomCommand(self, command_list):
    print('Running command: %s' % command_list)
    p = subprocess.Popen(
        command_list,
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    # Can use communicate(input='y\n'.encode()) if the command run requires
    # some confirmation.
    stdout_data, _ = p.communicate()
    print('Command output: %s' % stdout_data)
    if p.returncode != 0:
      raise RuntimeError(
          'Command %s failed: exit code: %s' % (command_list, p.returncode))

  def run(self):
    for command in CUSTOM_COMMANDS:
      self.RunCustomCommand(command)

setup(name='dataflow_python_examples',
        version='1.0',
        description='Python Dataflow Examples',
        author='Michael Chi',
        install_requires=["pyodbc"],
        packages=setuptools.find_packages(),
        cmdclass={
            # Command class instantiated and run during pip install scenarios.
            'build': build,
            'CustomCommands': CustomCommands,
        }
    )
    )