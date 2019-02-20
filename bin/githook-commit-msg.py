#!/usr/bin/python2

#
# A hook script called by .git/hooks/commit-msg
#

import os, sys
import subprocess



dot_git_hooks_commit_msg = '''
#!/bin/sh
#
# .git/hooks/commit-msg
#
# A hook script to check the commit log message.
# Called by "git commit" with one argument, the name of the file
# that has the commit message.  The hook should exit with non-zero
# status after issuing an appropriate message if it wants to stop the
# commit.  The hook is allowed to edit the commit message file.
#

echo "PWD is $PWD"
./bin/githook-commit-msg.py $1
'''


c = open(sys.argv[1]).read()
print 'got a file of length', len(c)

lines = [
    l for l in c.split('\n')
    if not (l.startswith('#') or l.strip() == '')
]
message = ' '.join(lines)
print 'message was', message
tweet = (
    'https://twitter.com/home?status='
    + '%23ttrpg %23gamedesign New update to https://www.1kfa.com/table - '
    + message
).replace(' ', '+')

print ''
print 'Tweet!'
print ''
print tweet
print ''

files = subprocess.check_output(['git', 'status', '-s'])
print 'files:', files
