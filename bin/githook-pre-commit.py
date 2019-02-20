#!/usr/bin/python2

#
# A hook script called by .git/hooks/commit-msg
#

import os, sys
import subprocess


dot_git_hooks_pre_commit = '''
#!/bin/sh
#
# .git/hooks/pre-commit
#

./bin/githook-pre-commit.py
'''

files = subprocess.check_output(['git', 'status', '-s'])
# Format of git status -s:
# M  README.md
#  M bin/githook-commit-msg.py
# ?? bin/githook-pre-commit.py

files = [
    f.split()[-1] for f in files.split('\n')
    if f.startswith('M')
]
print 'added-modified files:', files

md_files = [
    f for f in files
    if f.endswith('.md')
]

for fname in md_files:
    print '-----------------'
    print 'misspelled words: (`aspell check ' + fname +'` to fix)'
    os.system('cat ' + fname + ' | aspell list')
    print ''
