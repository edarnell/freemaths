<?php
require 'config.php';
$ajax = new Ajax;
return $ajax;
// remove apcu for now - perhaps add back in
class Ajax
{
    private $config, $con, $last, $token, $_db, $u, $start, $mailer, $origin;
    function request()
    {
        $this->init();
        $json = json_decode(file_get_contents("php://input"), true);
        if ($json && isset($json['req'])) {
            $this->debug($json, true);
            if (method_exists($this, 'req_' . $json['req'])) $resp = $this->{'req_' . $json['req']}($json);
            else $resp = ['e' => '404', 'r' => ['error' => "404 ({$json['req']} Not Found)"]];
            $this->response($resp);
            if ($this->con) $this->db('close'); // don't leave open db
            $this->debug($resp);
            if (isset($resp['send'])) {
                // send after response to prevent lag
                //sleep(1); // perhaps  - allow context-switch for response to be sent
                $this->mail($resp['send']);
                $this->debug(['sent' => $resp['send']]);
            }
        } else $this->debug($json);
    }
    private function req_mail($json)
    {
        if (isset($json['token'])) { // read
            $tok = json_decode($this->decrypt($json['token']), true); // logid_token
            $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log where id=?", ['i', &$tok['logid']])[0];
            $ret = ['mail' => $tok, 'log' => $log];
        } else if (isset($json['form'])) { // send
            if (isset($json['hidden']) && isset($json['hidden']['re'])) $l = $json['hidden']['re'];
            if (isset($l) && isset($l['mail'])) { //reply TODO need to catch case of resend - switch to and from
                $from = $l['mail']['to'];
                if (isset($from['id']) && $from['id'] == 1) $from['name'] = "Ed Darnell"; // change from Freemaths.uk
                $to = $l['mail']['from'];
            } else if (isset($json['form']['email'])) {
                $from = ['email' => $json['form']['email'], 'name' => $json['form']['name']];
                $to = ['id' => 1, 'name' => 'FreeMaths.uk', 'email' => 'ed.darnell@freemaths.uk'];
            } else {
                $user = $this->user(); // need to catch case of me/tutors sending to students
                $from = ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']];
                if (isset($json['hidden']) && isset($json['hidden']['to'])) $to = $json['hidden']['to'];
                else $to = ['id' => 1, 'name' => 'FreeMaths.uk', 'email' => 'ed.darnell@freemaths.uk'];
            }
            if (!filter_var($from['email'], FILTER_VALIDATE_EMAIL)) $ret = ['e' => 422, 'r' => ['email' => 'invalid']];
            else {
                $mail = ['to' => $to, 'from' => $from, 'message' => $json['form']['message']];
                if (isset($json['form']['maths'])) $mail['maths'] = $json['form']['maths'];
                if (isset($l)) $mail['log'] = $l;
                if (isset($json['hidden']) && isset($json['hidden']['re'])) $mail['re'] = $json['hidden']['re'];
                $lid = $this->log(['log' => ['e' => 'Send', 'mail' => $mail]], isset($from['id']) ? $from['id'] : null);
                $token = $this->encrypt(json_encode(['logid' => $lid]));
                //?? $json['from']=$from;
                $ret = ['send' => ['type' => 'contact', 'mail' => $mail, 'token' => $token, 'lid' => $lid]];
            }
        }
        return $ret;
    }
    private function log($json, $uid = null)
    {
        if ($uid === null) $uid = $this->user() ? $this->u['id'] : 0;
        $l = json_encode($json['log']);
        $id = $this->db("insert into log (user_id,json) values(?,?)", ['is', &$uid, &$l]);
        $ret = $id;
        // TODO fix email/photos use meta table
        if ($json['log']['e'] == 'Send' || $json['log']['e'] == 'SendPhoto') {
            $l2 = $json['log'];
            $l2['e'] = 'Email';
            $l2['senderLogId'] = $id;
            $toid = isset($l2['mail']['to']) ? (isset($l2['mail']['to']['id']) ? $l2['mail']['to']['id'] : 0) : 1; // not sure if toid of 0 always set
            $l2 = json_encode($l2);
            $id = $this->db("insert into log (user_id,json) values(?,?)", ['is', &$toid, &$l2]);
            $ret = $id;
        }
        return $ret;
    }
    private function req_test($json)
    {
        $user = $this->user();
        if ($to = $this->db("select id,name,email from users where id=?", ['i', &$json['uid']])) {
            $to = $to[0]; // first row
            $l = json_encode(['e' => 'Test', 't' => $json['tid'], 'uid' => $to['id'], 'by' => ['name' => $user['name'], 'id' => $user['id']]]);
            $lid = $this->db("insert into log (user_id,json) values(?,?)", ['is', &$to['id'], &$l]);
            if ($to['id'] != $user['id']) $this->db("insert into log (user_id,json) values(?,?)", ['is', &$user['id'], &$l]);
            //$this->mail('test', ['to' => $to, 'from' => $user]);
            $token = $this->encrypt(json_encode(['logid' => $lid]));
            return ['send' => ['type' => 'test', 'm' => ['to' => $to, 'from' => $user, 'lid' => $lid, 'token' => $token]]];
        }
    }
    private function req_log($json, $uid = null)
    {
        $uid = $uid === null && $this->user() ? $this->u['id'] : 0;
        $l = json_encode($json['log']);
        $id = $this->db("insert into log (user_id,json) values(?,?)", ['is', &$uid, &$l]);
        return $uid ? ['u' => $this->u($json)] : ['lid' => $id];
    }

    private function req_error($json)
    {
        $l = json_encode($json['error']);
        $id = $this->db("insert into log (user_id,json) values(1,?)", ['s', &$l]);
        return ['lid' => $id, 'send' => ['type' => 'error', 'lid' => $id]];
    }

    private function req_debug($json)
    {
        $uid = $this->user() ? $this->u['id'] : 0;
        $this->debug(['uid' => $uid, 'debug' => $json['debug']]);
    }

    private function req_task($json)
    {
        $e = null;
        if (!isset($json['uid'])) $e = ['e' => '401', 'r' => ['error' => 'Invalid tutee']];
        else {
            $log = ['e' => 'Task', 'date' => $json['date'], 'topic' => $json['topic'], 'task' => $json['task'], 'notes' => $json['notes'], 'task_notes' => $json['task_notes']];
            $this->log(['log' => $log], $json['uid']);
        }
        return $e ?: ['u' => $this->u($json)];
    }

    private function req_maths($json)
    {
        $e = null;
        if (!($user = $this->user())) $e = ['e' => '401', 'r' => ['error' => 'Invalid token.']];
        else if (!isset($json['maths'])) $e = ['e' => '422', 'r' => ['maths' => 'required.']];
        else {
            $title = isset($json['title']) ? $json['title'] : '';
            $log = ['e' => 'Maths', 'title' => $title, 'maths' => $json['maths']];
            if (isset($json['email'])) $ret = $this->req_mail(['form' => ['message' => ''], 'hidden' => ['log' => $log]]);
            else $ret = $this->log(['log' => $log]);
        }
        return $e ? $e : $ret;
    }
    private function files($vts, $versions)
    {
        $files = [];
        foreach (['tests', 'questions', 'help', 'books', 'past', 'videos', 'vars', 'syllabus'] as $name) {
            if ($versions[$name]['ts'] > $vts) {
                if ($name === 'videos') $files['videos'] = $this->videos();
                else {
                    $gz = __DIR__ . '/../storage/' . $name . '.gz';
                    $ts = filemtime($gz);
                    $file = file_get_contents($gz);
                    $files[$name] = ['name' => $name, 'file' => $file, 'ts' => $ts];
                }
            }
        }
        return count($files) ? ['versions' => $versions, 'files' => $files] : ['versions' => $versions];
    }

    private function req_file($json)
    {
        $gz = __DIR__ . '/../storage/' . $json['name'] . '.gz';
        $ts = filemtime($gz);
        $file = file_get_contents($gz);
        return ['name' => $json['name'], 'file' => $file, 'ts' => $ts];
    }

    private function req_save($json)
    {
        $path = __DIR__ . '/../storage/';
        $diff = __DIR__ . '/../storage/diff/';
        $ret = [];
        $user = $this->user();
        if ($user && ($user['id'] == 1 || ($this->config['server'] !== 'live'))) {
            foreach ($json['data'] as $name => $gz) {
                if (!file_exists($diff . $name . '.gz')) file_put_contents($diff . $name . '.gz', file_get_contents($path . $name . '.gz'));
                file_put_contents($path . $name . '.gz', $gz);
                $ts = filemtime($path . $name . '.gz');
                $ret[$name] = ['name' => $name, 'file' => $gz, 'ts' => $ts];
            }
            $this->versions(['check_v' => true]);
        }
        //apcu_delete('versions');
        return $ret;
    }
    private function videos()
    {
        require_once 'videos.php';
        $ts = filemtime(__DIR__ . '/videos.php');
        $file = $this->zip(videos());
        return ['name' => 'videos', 'file' => $file, 'ts' => $ts];
    }
    private function versions($req = null)
    {
        $vts = $this->last ? $this->last['vts'] : 0;
        $versions = apcu_fetch($this->config['server'] . '_versions');
        if (!$versions || ($req && isset($req['check_v']) && $req['check_v'])) {
            $v2 = [];
            $v2['freemaths'] = $this->last ? $this->last['fm'] : 0;
            $path = __DIR__ . '/../storage/';
            $v2['debug'] = $this->config['debug'];
            foreach (['tests', 'questions', 'help', 'books', 'past', 'vars', 'syllabus'] as $name) {
                $v2[$name]['ts'] = filemtime($path . $name . '.gz');
                $v2[$name]['size'] = filesize($path . $name . '.gz');
            }
            $path = __DIR__ . '/';
            $v2['videos']['ts'] = filemtime(__DIR__ . '/videos.php');
            $v2['videos']['size'] = filesize(__DIR__ . '/videos.php');
            $v2['ts'] = $versions ? $versions['ts'] : 0; // try old ts
            if (!$versions || (json_encode($v2) != json_encode($versions))) {
                $v2['ts'] = time();
                $versions = $v2;
                $this->debug(['v' => $versions, 'v2' => $v2, 'vts' => $vts]);
                apcu_store($this->config['server'] . '_versions', $v2);
            }
        }
        return $vts == $versions['ts'] ? null : $this->files($vts, $versions);
    }
    private function req_login($json)
    {
        if ($ret = $this->validate($json['form'], ['email' => 'required', 'password' => 'required'])) {
            // do nothing - ret has error
        } else if ($this->user($json['form']['email'])) {
            if (password_verify($json['form']['password'], $this->u['password'])) {
                $r = $json['hidden'];
                $r['remember'] = $json['form']['remember'];
                $ret = $this->req_user($r, false);
            } else $ret = ['e' => '401', 'r' => ['password' => 'These credentials do not match our records.']];
        } else $ret = ['e' => '401', 'r' => ['password' => 'These credentials do not match our records.']];
        return $ret;
    }
    private function req_logout($json)
    {
        //TODO - add everywhere
        if ($user = $this->user()) {
            $l = json_encode(['e' => 'End']);
            $id = $this->db("insert into log (user_id,json) values (?,?)", ['is', &$user['id'], &$l]);
            $ret = ['logid' => $id, 'ts' => time(), 'json' => $l];
        } else $ret = ['e' => 401, 'r' => 'unauthorised'];
        return $ret;
    }

    private function token($req)
    {
        $t = null;
        if ($user = $this->user()) {
            $remember = isset($req['remember']) ? $req['remember'] : ($this->token ? $this->token['remember'] : null);
            $t = $this->encrypt(json_encode(['id' => $user['id'], 'time' => time(), 'remember' => $remember]));
        }
        return $t;
    }

    private function max_ts()
    {
        $ret = [];
        foreach (['users', 'meta', 'tutors'] as $table) {
        }
    }

    private function u($req)
    {
        $uts = $this->last ? $this->last['uts'] : 0;
        $lid = $this->last ? $this->last['lid'] : 0;
        $user = $this->user();
        if ($user['id'] == 1) {
            $max = $this->db("select unix_timestamp(max(uts)) as ts from users");
            if ($max[0]['ts'] > $uts) $user = $this->groups();
            else {
                $max = $this->db("select unix_timestamp(max(uts)) as ts from meta where type='tutee'");
                if ($max && $max[0]['ts'] > $uts) $user = $this->groups();
                else $user['uts'] = $uts; // set so unchanged
            }
            if ($lid == 0) {
                ini_set('memory_limit', '420M');
                $max = $this->db("select max(id) as mid from log");
                if ($max[0]['mid'] > 100000) $lid = $max[0]['mid'] - 100000; // prevent loading too much - needs extra code to ask for archives 
            }
            $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log where id>? order by id", ['i', &$lid]);
        } else {
            $user = $this->groups();
            $s = $this->db_in_values($user['users'], 'id', 'i', ['?s' => '', 'is' => 'i', 'vs' => [&$lid]]);
            $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log where id>? and user_id in ({$s['?s']}) order by id", $s['vs']);
        }
        $t = $this->token($req);
        $l = $log && count($log) ? ['log' => $log, 'lid' => $lid] : null;
        $u = $user['uts'] > $uts ? ['uts' => $uts, 'user' => $user] : null;
        $v = $this->versions($req);
        $this->debug(['uid' => $user['id'], 'u' => $u ? true : false, 'l' => $l ? true : false, 'v' => $v ? true : false]);
        // if ($user && $user['id'] == 1 && count($log) > 1000) ini_set('memory_limit', '420M');
        return $this->zip(['l' => $l, 'u' => $u, 't' => $t, 'v' => $v]);
    }

    private function req_user($json, $timeout = true)
    {
        $u = null;
        if ($user = $this->user()) {
            if ($ts = apcu_fetch($this->config['server'] . '_sync')) {
                if ($this->token && $ts > $this->token['time']) return ['u' => 'refresh'];
            }
            if (isset($json['test_password'])) $u = 'password';
            else if ($timeout && $this->token && !$this->token['remember'] && time() - $this->token['time'] > 30 * 60) $u = 'password';
            else {
                $l = json_encode(['e' => 'Start']);
                $this->db("insert into log (user_id,json) values (?,?)", ['is', &$user['id'], &$l]);
                $u = $this->u($json, true);
            }
        }
        return $u ? ['u' => $u] : ['v' => $this->versions($json)];
    }

    private function req_refresh($json)
    {
        $user = $this->user();
        if ($user) {
            $ret = ['u' => $this->u($json)];
        } else $ret = ['e' => 401, 'r' => 'unauthorised'];
        return $ret;
    }

    public function req_password($json)
    {
        if ($ret = $this->validate($json['form'], ['password' => 'required'])) {
            // do nothing - $ret has error
        } else {
            $user = $this->user();
            if (password_verify($json['form']['password'], $user['password'])) {
                $r = $json['hidden'];
                if (isset($json['auth'])) $ret = ['auth' => true];
                else {
                    if (isset($json['form']['remember'])) $r['remember'] = $json['form']['remember'];
                    $ret = $this->req_user($r, false);
                }
            } else $ret = ['e' => 401, 'r' => ['password' => 'incorrect']];
        }
        return $ret;
    }

    public function req_updateEmail($json)
    {
        $token = json_decode($this->decrypt($json['token']), true);
        if (!isset($token['ts']) || $token['ts'] < time() - 48 * 60 * 60) $ret = ['e' => 401, 'r' => ['error' => 'token timed out']]; // 48*60*60=>1 to test
        else {
            $user = $this->user(null, $token['id']);
            $this->debug(['user' => $user, 'token' => $token], false);
            if ($user['email'] == $token['new']) $ret = ['e' => 401, 'r' => ['error' => 'email already updated.']];
            else if ($user['email'] != $token['email']) $ret = ['e' => 401, 'r' => ['error' => 'invalid email token']];
            else {
                $u = $this->db('update users set email=? where id=? and email=?', ['sis', &$token['new'], &$token['id'], &$token['email']]);
                if ($u == 1) {
                    $this->db('update tutors set email=? where email=?', ['ss', &$token['new'], &$token['email']]);
                    $ret = ['id' => $token['id'], 'email' => $token['new']];
                } else $ret = ['e' => 500, 'error' => ['database update error']];
            }
        }
        return $ret;
    }
    private function req_group($json)
    {
        //TODO - add everywhere
        if ($user = $this->user()) {
            if (count($json['form']['members'])) {
                $owner = $json['form']['owner'];
                $type = 'group';
                $j = json_encode(['name' => $json['form']['name'], 'members' => $json['form']['members'], 'owner' => $json['form']['owner']]);
                if (isset($json['form']['gid'])) $this->db("update meta set user_id=?,type=?,json=? where id=?", ['issi', &$owner, &$type, &$j, &$json['form']['gid']]);
                else $id = $this->db("insert into meta (user_id,type,json) values (?,?,?)", ['iss', &$owner, &$type, &$j]);
                $ret = ['gid' => $json['form']['gid'] ?: $id, 'ts' => time()];
            } else $ret = ['e' => 422, 'r' => ['error' => 'members required']];
        } else $ret = ['e' => 401, 'r' => 'unauthorised'];
        return $ret;
    }
    public function req_photo($json)
    {
        $path = __DIR__ . '/../storage/photos/';
        if (isset($json['logid'])) {
            if ($photo = file_get_contents($path . $json['logid'])) $ret = ['jpeg' => $photo];
        } else if (isset($json['hidden']['jpeg'])) {
            if ($json['form']['title']) {
                $log['e'] = 'Photo';
                $log['title'] = $json['form']['title'];
                if (isset($json['button']) && $json['button'] === 'email') $ret = $this->req_mail(['form' => ['message' => ''], 'hidden' => ['log' => $log]]);
                else $ret = $this->log(['log' => $log]);
                file_put_contents($path . $ret['logid'], $json['hidden']['jpeg']);
            } else $ret = ['e' => 401, 'r' => ['title' => 'required']];
        } else $ret = ['e' => 401, 'r' => ['error' => 'invalid photo']];
        return $ret;
    }
    public function req_forgot($json)
    {
        $e = [];
        if (filter_var($json['form']['email'], FILTER_VALIDATE_EMAIL)) {
            if ($user = $this->user($json['form']['email'])) {
                $ts = time();
                $token = $this->encrypt(json_encode(['id' => $user['id'], 'ts' => $ts]));
                //$this->db("update users set token=? where id=?",['si',&$ts,&$user['id']]);
                //$this->mail('reset', $json, $token);
                $send = ['type' => 'reset', 'token' => $token];
            } else $e['email'] = 'not registered';
        } else $e['email'] = 'invalid';
        return count($e) ? ['e' => 401, 'r' => $e] : ['send' => $send, 'r' => 'Password Reset Sent'];
    }
    public function req_register($json)
    {
        $e = [];
        if (!isset($json['form']['name'])) $e['name'] = 'required';
        else if (strlen($json['form']['name']) > 255) $e['name'] = 'too long';
        else $u['name'] = $json['form']['name'];

        if (!filter_var($json['form']['email'], FILTER_VALIDATE_EMAIL)) $e['email'] = 'invalid';
        else {
            $i = $this->db('select id from users where email=?', ['s', &$json['form']['email']]);
            if (count($i) > 0) $e['email'] = 'already in use';
            else $u['email'] = $json['form']['email'];
        }
        if (count($e) == 0) {
            $uid = $this->db("insert into users (name,email,password) values(?,?,'')", ['ss', &$u['name'], &$u['email']]);
            $token = $this->encrypt(json_encode(['id' => $uid, 'ts' => time()]));
            $this->user($u['email']); // set for mail
            $send = ['type' => 'register', 'token' => $token];
            //$this->mail('register', $json['form'], $token);
        }
        return (count($e) > 0) ? ['e' => 422, 'r' => $e] : ['send' => $send, 'r' => 'account registered', 'uid' => $uid];
    }
    public function req_update($json)
    {
        if (isset($json['form']) && $user = $this->user()) {
            $u = [];
            $e = [];
            if (!isset($json['form']['name'])) $e['name'] = 'required';
            else if (strlen($json['form']['name']) > 255) $e['name'] = 'too long';
            else $u['name'] = $json['form']['name'];

            if (!filter_var($json['form']['email'], FILTER_VALIDATE_EMAIL)) $e['email'] = 'invalid';
            else if ($json['form']['email'] == $user['email']) $u['email'] = $user['email'];
            else {
                $i = $this->db('select id from users where email=?', ['s', &$json['form']['email']]);
                if (count($i) > 0) $e['email'] = 'already in use';
                else $u['email'] = $json['form']['email'];
            }
            if (isset($json['form']['password'])) {
                if (strlen($json['form']['password']) < 6) $e['password'] = 'minimum length 6';
                else if ($json['form']['password'] != $json['form']['password_confirm']) $e['password_confirm'] = 'must match';
                else $u['password'] = password_hash($json['form']['password'], PASSWORD_DEFAULT);
            } else $u['password'] = $user['password'];

            if (count($e) == 0) {
                if ($u['name'] != $user['name'] || $u['password'] != $user['password']) {
                    $pw = $u['password'] != $user['password']; // for cypress testing as submits when it shouldn't
                    $i = $this->db("update users set name=?,password=? where id=?", ['ssi', &$u['name'], &$u['password'], &$user['id']]);
                    if ($i !== 1) $ret = ['e' => 500, 'r' => ['error' => 'database error']];
                    else $ret = ['name' => $u['name'], 'email' => $u['email'], 'password' => $pw];
                } else $ret = ['name' => $u['name'], 'email' => $u['email']];
                if ($u['email'] !== $user['email']) {
                    $token = $this->encrypt(json_encode(['id' => $user['id'], 'email' => $user['email'], 'new' => $u['email'], 'ts' => time()]));
                    $this->u['email'] = $u['email']; // send email to new address
                    $this->u['name'] = $u['name'];
                    //$this->mail('newEmail', $json, $token);
                    $ret['uid'] = $user['id'];
                    $ret['send'] = ['type' => 'newEmail', 'token' => $token];
                }
            } else $ret = ['e' => 422, 'r' => $e];
        } else $ret = ['e' => 401, 'r' => ['error' => 'unauthorised']];
        return $ret;
    }
    public function req_reset($json)
    {
        $token = json_decode($this->decrypt($json['hidden']['token']), true);
        if (!isset($token['ts']) || $token['ts'] > time() + 48 * 60 * 60) $ret = ['e' => 401, 'r' => ['error' => 'token timed out']];
        else {
            $user = $this->user(null, $token['id']);
            $this->debug(['user' => $user, 'token' => $token], false);
            if ($user['uts'] > $token['ts']) $ret = ['e' => 401, 'r' => ['error' => 'invalid token']];
            else if (strlen($json['form']['password']) < 6) $ret = ['e' => 422, 'r' => ['password' => 'minimum length 6']];
            else if ($json['form']['password'] != $json['form']['password_confirm']) $ret = ['e' => 422, 'r' => ['password_confirm' => 'must match']];
            else {
                $password = password_hash($json['form']['password'], PASSWORD_DEFAULT);
                $this->db("update users set password=? where id=?", ['si', &$password, &$user['id']]);
                $ret = $this->req_user($json['hidden'], false);
            }
        }
        return $ret;
    }
    public function req_unsub($json)
    {
        /* to add
        if (isset($json['token'])) {
            $token=$this->json_decode(decrypt($json['token']),true);
            $user=$this->user(null,$token['id']);
        }*/
        $user = $this->user();
        if (password_verify($json['form']['password'], $user['password'])) {
            $this->db("update users set name=?,email=? where id=?", ['ssi', &$user['id'], &$user['id'], &$user['id']]);
            $this->db("delete from tutors where user_id=? or email=?", ['is', &$user['id'], &$user['email']]);
            $token = $this->encrypt(json_encode(['user' => $user]));
            //$this->mail('unsubscribe', null, $token, $user);
            $ret = ['send' => ['type' => 'unsubscribe', 'token' => $token], 'unsubscribe' => 'account deteted', 'uid' => $user['id']];
        } else $ret = ['e' => 401, 'r' => ['password' => 'incorrect']];
        return $ret;
    }
    private function db_in_values(&$list, $key = null, $type, $i = ['?s' => '', 'is' => '', 'vs' => []])
    {
        if (!count($list)) {
            $ret = '';
            $this->debug(['db_in_values' => $list]);
        } else {
            $ret = $i;
            foreach ($list as $k => $d) {
                if ($ret['?s']) $ret['?s'] .= ',?';
                else $ret['?s'] = '?';
                $ret['is'] .= $type;
                if ($key) $ret['vs'][] = &$list[$k][$key];
                else $ret['vs'][] = &$list[$k];
            }
            array_unshift($ret['vs'], $ret['is']);
        }
        //$this->debug(['in'=>$ret],false,500);
        return $ret;
    }

    public function req_tutors()
    {
        $user = $this->user();
        $tutors = $this->db("SELECT tutors.email,name FROM tutors left join users on tutors.email=users.email where user_id=?", ['i', &$user['id']]);
        return ['tutors' => $tutors];
    }

    public function req_tutor($json)
    {
        $added = 0;
        $removed = 0;
        $errors = [];
        $add = [];
        $remove = [];
        $tutors = [];
        $user = $this->user();
        $this->debug($json);
        foreach ($this->db("SELECT email FROM tutors WHERE user_id=?", ['i', &$user['id']]) as $row) $tutors[] = $row['email'];
        foreach ($json['form'] as $key => $value) {
            if (isset($json['hidden']) && isset($json['hidden']['tutors']) && strpos($key, 'tutor_') === 0 && $value) {
                $t = substr($key, 6);
                if (isset($json['hidden']['tutors'][$t])) $remove[] = $json['hidden']['tutors'][$t]['email'];
            }
        }
        foreach (['1', '2', '3'] as $k) if (($tutor = $json['form']["email_$k"]) != '') {
            $key = "email_$k";
            if ($tutor == $user['email']) $errors[$key] = "You can't add yourself";
            else if (in_array($tutor, $tutors)) $errors[$key] = 'Already added';
            else if (!filter_var($tutor, FILTER_VALIDATE_EMAIL)) $errors[$key] = 'Invalid email';
            else if (!in_array($tutor, $add)) $add[] = $k; //TODO add key to table
        }
        if (count($errors) == 0 && count($remove)) {
            $in = $this->db_in_values($remove, null, 's');
            $in['vs'][0] .= 'i';
            $in['vs'][] = &$user['id'];
            $removed = $this->db("delete from tutors where email in ({$in['?s']}) and user_id=?", $in['vs']);
        }
        if (count($errors) == 0 && count($add) > 0) {
            foreach ($add as $k) $added += $this->db("insert into tutors (user_id,email,type) values (?,?,?)", ['iss', &$user['id'], &$json['form']["email_$k"], &$json['form']["t_$k"]]);
        } else if (count($errors) == 0 && count($add) == 0 && $removed == 0) $errors["error"] = "Nothing added or removed.";
        $tutors = $this->db("SELECT tutors.email,name FROM tutors left join users on tutors.email=users.email where user_id=?", ['i', &$user['id']]);
        return count($errors) ? ['e' => 422, 'r' => $errors] : ['added' => $added, 'removed' => $removed, 'tutors' => $tutors];
    }
    private function req_students($json)
    {
        $user = $this->user();
        if ($user = $this->user()) {
            if ($user['id'] === 1) {
                $students = $this->db("select users.id,name,email,unix_timestamp(users.ts) as registered,unix_timestamp(uts) as updated,max(unix_timestamp(log.ts)) as visited from users,log where users.id=log.user_id group by users.id order by visited desc", []);
                if (isset($json['all']) && $json['all']) $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log order by id", []);
                else {
                    $d = date('Y-m-d', strtotime('-1 years'));
                    $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log where ts > ? order by id", ['s', &$d]);
                }
                //$log=$this->db("select id,user_id,event,paper,question,answer,comment,variables,ts from logs order by id",[]);
                $ret = ['log' => $this->zip($log), 'students' => $this->zip($students)];
            } else {
                $students = $this->db("SELECT users.id,name FROM users inner join tutors on user_id=users.id where tutors.email=?", ['s', &$user['email']]);
                if ($groups = $this->db("SELECT id,meta.json FROM meta where user_id=? and meta.type='group'", ['i', &$user['id']])) {
                    if (!$students) $students = [];
                    foreach ($groups as $g) {
                        $json = json_decode($g['json'], true);
                        foreach ($json['members'] as $id) {
                            $students[] = ['id' => $id];
                        }
                    }
                }
                if ($s = $this->db_in_values($students, 'id', 'i')) {
                    if ($groups) $students = $this->db("SELECT id,name FROM users where id in ({$s['?s']})", $s['vs']);
                    $log = $this->db("select id,user_id,unix_timestamp(ts) as ts,json from log where user_id in ({$s['?s']}) order by id", $s['vs']);
                    $ret = ['log' => $this->zip($log), 'students' => $this->zip($students)];
                }
            }
        } else $ret = ['e' => 401, 'r' => 'unauthorised'];
        return $ret;
    }

    private function req_tutee($json)
    {
        $user = $this->user();
        if ($user['id'] == 1 && $uid = $json['uid']) {
            if ($r = $this->db("select id,json from meta where user_id={$uid} && type='tutee'")) {
                $id = $r[0]['id'];
            } else $id = 0;
            if (isset($json['name']) && isset($json['notes']) && isset($json['parent'])) {
                $j = json_encode(['name' => $json['name'], 'notes' => $json['notes'], 'parent' => $json['parent']]);
                if ($id) $this->db("update meta set json=? where id={$id} and type='tutee'", ['s', &$j]);
                else $this->db("insert into meta (user_id,type,json) values ({$uid},'tutee',?)", ['s', &$j]);
                $r = $this->db("select user_id,json from meta where user_id={$uid} && type='tutee'");
            }
        }
        return isset($r) ? ['tutee' => $r ? $r[0]['json'] : null] : ['e' => 422, 'r' => 'invalid tutee'];
    }

    private function book($bk = null)
    {
        $ret = [];
        if ($b = $this->db("select id,json,unix_timestamp(uts) as uts from meta where user_id=1 && type='booking'")) {
            $ret = json_decode($b[0]['json'], true);
            $ret['ts'] = $b[0]['uts'];
            $bid = $ret['bid'] = $b[0]['id'];
        } else $bid = $ret['bid'] = 0;

        if ($bk && $bk['bid'] == $bid) {
            $j = json_encode($bk);
            if (!$bid || $this->db("delete from meta where id={$bid} && type='booking'")) {
                if ($this->db("insert into meta (user_id,type,json) values (1,'booking',?)", ['s', &$j])) {
                    $ret = $this->book();
                }
            }
        }
        return $ret;
    }

    private function req_ws()
    {
        return ['ws' => isset($this->config['ws']) ? $this->config['ws'] : ''];
    }

    private function req_tutoring($json)
    {
        $bk = $this->book();
        $bid = $bk['bid'];
        $user = $this->user();
        $uid = isset($json['uid']) ? $json['uid'] : $user['id'];
        if (isset($json['day']) && isset($json['time']) && isset($json['name'])) {
            $bk[$uid] = ['day' => $json['day'], 'time' => $json['time'], 'name' => $json['name']];
            $bk = $this->book($bk);
        } else if (isset($json['cancel'])) {
            if ($bk[$uid]) unset($bk[$uid]);
            $bk = $this->book($bk);
        } else if (isset($json['skip'])) {
            if ($bk[$uid] && $json['skip']) $bk[$uid]['skip'] = $json['skip'];
            else if ($bk[$uid] && isset($bk[$uid]['skip'])) unset($bk[$uid]['skip']);
            $bk = $this->book($bk);
        }
        $booking = isset($bk[$uid]) ? $bk[$uid] : null;
        return $bid == $bk['bid'] ? ['booked' => $bk] : ['booked' => $bk, 'send' => ['type' => 'booking', 'booking' => $booking, 'name' => $json['name']]];
    }

    private function req_errorlog($json)
    {
        $user = $this->user();
        if ($user['id'] == 1) {
            if (isset($json['clear']) && $json['clear']) {
                rename('../storage/error.log', '../storage/backups/error.log.' . time());
                $this->debug("log cleared");
            }
            return ['errorlog' => $this->zip(file_get_contents('../storage/error.log'))];
        } else return ['e' => 401, 'r' => 'unauthorised'];
    }
    private function req_diff()
    {
        $user = $this->user();
        $files = [];
        if ($user['id'] == 1) {
            foreach (['live', 'beta', 'diff'] as $dir) {
                foreach (['past', 'books', 'tests', 'help'] as $name) {
                    $gz = __DIR__ . '/../storage/' . $dir . '/' . $name . '.gz';
                    if (file_exists($gz)) {
                        $ts = filemtime($gz);
                        $file = file_get_contents($gz);
                        $files[] = ['dir' => $dir, 'name' => $name, 'file' => $file, 'ts' => $ts];
                    }
                }
            }
            return count($files) ? ['files' => $files] : ['e' => 400, 'r' => 'no files to diff'];
        } else return ['e' => 401, 'r' => 'unauthorised'];
    }
    private function req_data($json)
    {
        $e = null;
        if ($r = json_decode($this->decrypt($json['server']), true)) {
            if ($r) {
                if (time() - $r['ts'] < 10 && $r['ts'] - time() < 10) $ret = $this->get_all_data($json);
                else $e = 'invalid ts';
            } else $e = 'invalid server';
        } else $e = 'invalid sync';
        return $e ? ['error' => $e] : $ret;
    }
    private function get_all_data($json)
    {
        $ret = [];
        if (!$json['uts']) ini_set('memory_limit', '420M');
        foreach (['users', 'log', 'meta', 'tutors'] as $table) {
            if ($table == 'log' && $json['uts']) {
                $id = $json['uts'][$table]['id'];
                $d = $this->db("select * from {$table} where id>? order by id", ['i', &$id]);
            } else $d = $this->db("select * from {$table} order by id");
            $ret[$table] = $d ? $this->zip($d) : null;
        }
        $ret['photos'] = $this->zip(scandir('../storage/photos'));
        return $ret;
    }
    private function uts()
    {
        $uts = ['log' => ['id' => 187000]]; // default to prevent full reload (circa Jan 6 2023)
        if ($sync = $this->db("select json from meta where type='sync' and user_id=1")) {
            $uts = json_decode($sync[0]['json'], true);
        }
        return $uts;
    }
    private function save_uts()
    {
        $uts = $this->max_uts();
        $j = json_encode($uts);
        $this->db("insert into meta (user_id,type,json) values (1,'sync',?)", ['s', &$j]);
    }
    private function req_DB($req)
    {
        $user = $this->user();
        $uts = null;
        if ($this->config['server'] === 'development' && in_array($req['op'], ['freemaths→fmtest', 'fmtest→freemaths', 'save', 'restore', 'clear'])) {
            switch ($req['op']) {
                case 'freemaths→fmtest':
                    $db = 'fmtest';
                case 'fmtest→freemaths':
                    if (!isset($db)) $db = 'freemaths';
                    $this->_db['db'] = $db;
                    apcu_store($this->config['server'] . '_db', $this->_db);
                    if ($this->con) {
                        mysqli_close($this->con);
                        $this->con = null;
                    }
                    break;
                case 'save':
                    $this->save_uts();
                    break;
                case 'restore':
                    $uts = $this->uts();
                case 'clear':
                    // may not work correctly with tutors/meta/users 
                    foreach (['users', 'meta', 'tutors', 'log'] as $table) {
                        if ($uts) {
                            $id = isset($uts[$table]['id']) ? $uts[$table]['id'] * 1 : 0;
                            $r = $this->db("delete from {$table} where id>{$id}");
                            $id++;
                            $this->db("alter table {$table} auto_increment={$id}");
                            $this->debug(['table' => $table, 'r' => $r, 'id' => $id]);
                            $ts = isset($uts[$table]['uts']) ? $uts[$table]['uts'] * 1 : 0;
                            $e = $this->db("select id from {$table} where ts>from_unixtime({$ts})");
                            if ($e) $this->debug(['table' => $table, 'ts' => $ts, 'r' => $r, 'e' => $e]);
                        } else $this->db("truncate table {$table}");
                    }
                    if ($uts) $this->save_uts(); // re-save
                    break;
            }
        } else if ($user && $user['id'] == 1 && in_array($this->config['server'], ['development', 'beta'])) {
            $host = $req['op'] == 'beta' ? 'https://beta.freemaths.uk/ajax' : 'https://freemaths.uk/ajax';
            $uts = false;
            if (!$uts) ini_set('memory_limit', '600M');
            switch ($req['op']) {
                case 'sync':
                case 'beta':
                    $uts = $this->uts();
                case 'copy':
                    //TODO users could be synced based on uts as never deleted (so can delete and re-insert)
                    if ($ret = $this->curl(['req' => 'data', 'uts' => $uts], true, $host)) {
                        $this->debug($ret);
                        foreach (['users', 'meta', 'tutors', 'log'] as $table) {
                            $id = ($uts && $table == 'log') ? $uts['log']['id'] : 0;
                            if ($ret[$table]) $this->sync_table($table, $this->unzip($ret[$table]), $id);
                        }
                        $this->save_uts(); // beta should have it already
                    }
                default: // 'info'
                    //$ret=['db'=>$this->_db, 'tables' => $this->max_uts(),'uts'=> apcu_fetch($this->config['server'] . '_uts')];
            }
        }
        return ['db' => $this->_db, 'tables' => $this->max_uts(), 'uts' => $this->uts()];
    }
    private function curl($req, $decode = true, $url = 'http://freemaths/ajax')
    {
        $ch = curl_init($url);
        $req['server'] = $this->encrypt(json_encode(['server' => $this->config['server'], 'ts' => time()]));
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($req));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $ret = curl_exec($ch);
        if (!$ret) $this->debug(['curl_error' => curl_error($ch)]);
        curl_close($ch);
        return $ret && $decode ? json_decode($ret, true) : $ret;
    }
    private function req_photos($json)
    {
        if ($r = json_decode($this->decrypt($json['server']), true))
            if (time() - $r['ts'] < 10 && $r['ts'] - time() < 10) {
                $photos = []; // can output error if photo does not exist - but non-exist photos should not be requested
                foreach ($json['photos'] as $photo) $photos[$photo] = [$photo => file_get_contents('../storage/photos/' . $photo)];
            } else $e = 'invalid server request';
        return isset($e) ? ['e' => 401, 'r' => $e] : ['photos' => $photos];
    }
    private function sync_photos($photos)
    {
        $get = []; // beware - locally generated won't be deleted and may clash - could delete any newer than last backup
        if ($photos) foreach ($photos as $photo) if (!file_exists('../storage/photos/' . $photo)) $get[] = $photo;
        if (count($get)) {
            $ps = $this->curl(['req' => 'photos', 'photos' => $get]);
            foreach ($ps['photos'] as $id => $photo) file_put_contents('../storage/photos/' . $id, $photo);
        }
        return ['photos' => $get];
    }
    private function max_uts()
    {
        $uts = ['ts' => 0];
        foreach (['users', 'meta', 'tutors', 'log'] as $table) {
            $ts = $table == 'log' ? 'ts' : 'uts';
            if ($t = $this->db("select count(id) as 'rows', max(id) as id, max(unix_timestamp({$ts})) as uts from {$table}")) {
                $uts[$table] = $t[0];
                if ($t[0]['uts'] > $uts['ts']) $uts['ts'] = $t[0]['uts'];
            } else $uts[$table] = ['rows' => 0, 'id' => 0, 'uts' => 0];
        }
        return $uts;
    }
    private function sync_table($table, $rows, $id = 0, $uts = 0)
    {
        //ALTER TABLE tablename AUTO_INCREMENT = value
        //TODO incremental versus full. Only log should be increnetal.
        if ($this->config['server'] === 'live') return ['rows' => 0, 'errors' => 'live!'];
        else if ($this->config['server'] === 'development' || $this->config['server'] === 'beta') {
            $cols = $this->db('show columns from ' . $table);
            $v = ['?s' => '', 'is' => '', 'cols' => [], 'vs' => [], 'val' => []];
            foreach ($cols as $d) {
                $col = $d['Field'];
                $v['?s'] .= $v['?s'] ? ',?' : '?';
                $v['is'] .= (substr($d['Type'], 0, 3) == 'int') ? 'i' : 's';
                $v['cols'][] = $col;
                $v['val'][$col] = null;
                $v['vs'][] = &$v['val'][$col];
            }
            array_unshift($v['vs'], $v['is']);
            $del = '';
            if (!$id) {
                $this->db("truncate table {$table}");
                $del = 'truncate';
            } else {
                $id = $id * 1;
                // alter doesn't like prepared statement
                $del = $this->db("delete from {$table} where id>{$id}");
                //$this->db("alter table {$table} auto_increment={$sid}");
            }
            $count = 0;
            $error = 0;
            if ($rows) {
                $cs = implode(',', $v['cols']);
                $id = 0;
                //$this->debug("INSERT INTO {$table} ({$cs}) VALUES ({$v['?s']})");
                $in = $this->con->prepare("INSERT INTO {$table} ({$cs}) VALUES ({$v['?s']})");
                //$up = $this->con->prepare("UPDATE {$table} set json='?' where type='maths' 
                call_user_func_array(array($in, 'bind_param'), $v['vs']);
                $this->con->query('START TRANSACTION');
                $this->debug(['insert' => $table, 'cs' => $cs, 'rows' => count($rows), 'row' => $rows[0]]);
                foreach ($rows as $row) {
                    foreach ($v['cols'] as $col) $v['val'][$col] = $row[$col];
                    if (!$in->execute()) {
                        $this->debug(['error' => $this->con->error, 'row' => $row]);
                        $error++;
                        break;
                    } else {
                        $count++;
                        $id = $row['id'];
                    }
                }
                $this->db("alter table {$table} auto_increment={$id}");
                $in->close();
                $this->con->query('COMMIT');
            }
            $this->debug(['sync' => $table, 'deleted' => $del, 'inserted' => $count, 'errors' => $error]);
            return $error ? false : true;
        }
    }
    private function groups($id = 0)
    {
        $user = $id ? $this->user(null, $id) : $this->user();
        if ($user['id'] == 1) $gs = $this->db("SELECT id,user_id,meta.json,unix_timestamp(uts) as uts FROM meta where meta.type='group'");
        else $gs = $this->db("SELECT id,user_id,meta.json,unix_timestamp(uts) as uts FROM meta where meta.type='group' and user_id=?", ['i', &$user['id']]);
        if ($gs && count($gs)) {
            $user['groups'] = [];
            foreach ($gs as $m) {
                $user['groups'][] = $m;
                if ($m['uts'] > $user['uts']) $user['uts'] = $m['uts'];
            }
        }
        $users = [];
        if ($user['id'] == 1) {
            $users[0] = ['id' => '0', 'name' => 'Anon'];
            $u = $this->db("SELECT id,name,email,unix_timestamp(uts) as uts FROM users");
            $t = $this->db("select user_id,json,unix_timestamp(uts) as uts from meta where type='tutee'");
        } else {
            $ids[$user['id']] = ['id' => $user['id']];
            if (isset($user['groups'])) {
                foreach ($user['groups'] as $g) {
                    $json = json_decode($g['json'], true);
                    foreach ($json['members'] as $id) {
                        $ids[$id] = ['id' => $id];
                    }
                }
            }
            if ($sts = $this->db("SELECT user_id,unix_timestamp(uts) as uts FROM tutors where email=?", ['s', &$user['email']])) {
                foreach ($sts as $st) {
                    $ids[$st['user_id']] = ['id' => $st['user_id']];
                    if ($st['uts'] > $user['uts']) $user['uts'] = $st['uts'];
                }
            }
            $s = $this->db_in_values($ids, 'id', 'i');
            $u = $this->db("SELECT id,name,email,unix_timestamp(uts) as uts FROM users where id in ({$s['?s']})", $s['vs']);
        }
        if (isset($u)) foreach ($u as $v) {
            $users[$v['id']] = $v;
            if ($v['uts'] > $user['uts']) $user['uts'] = $v['uts'];
        }
        if (isset($t) && $t) foreach ($t as $v) {
            if ($tu = $users[$v['user_id']]) {
                $j = json_decode($v['json'], true);
                $tu['name'] = $j['name'];
                $tu['notes'] = $j['notes'];
                $tu['parent'] = $j['parent'];
                $users[$v['user_id']] = $tu;
                if ($v['uts'] > $user['uts']) $user['uts'] = $v['uts'];
            }
        }
        $user['users'] = $users;
        $user['password'] = null;
        $user['uts'] = $user['uts'] * 1;
        return $user;
    }

    public function user($email = null, $id = null)
    {
        if (!isset($this->u) || $id) {
            // add caching to this
            if ($email) $u = $this->db("select id,name,email,password,unix_timestamp(uts) as uts from users where email=?", ['s', &$email]);
            else if ($id) $u = $this->db("select id,name,email,password,unix_timestamp(uts) as uts from users where id=?", ['i', &$id]);
            else if ($this->token) $u = $this->db("select id,name,email,password,unix_timestamp(uts) as uts from users where id=?", ['i', &$this->token['id']]);
            $user = isset($u) && count($u) == 1 ? $u[0] : null;
            $this->u = $user;
        }
        return $this->u;
    }
    private function validate($req, $spec)
    {
        foreach ($spec as $key => $type) {
            if (!$req[$key]) $error[$key] = $type;
        }
        return isset($error) ? ['e' => '422', 'r' => $error] : null;
    }
    private function init()
    {
        error_reporting(E_ALL); // Reports all errors
        ini_set('display_errors', 'Off'); // Do not display errors for the end-users (security issue)
        ini_set('error_log', __DIR__ . '/../storage/error.log'); // Set a logging file
        $this->start = microtime(true);
        $this->config = config();
        $this->con = null;
        $this->mailer = null;
        if (isset($_SERVER['HTTP_FM_TOKEN'])) {
            $tok = $this->decrypt($_SERVER['HTTP_FM_TOKEN']);
        }
        $this->token = $tok ? json_decode($tok, true) : null;
        $this->last = isset($_SERVER['HTTP_FM_LAST']) ? json_decode($_SERVER['HTTP_FM_LAST'], true) : null;
        $this->origin = isset($_SERVER['HTTP_FM_ORIGIN']) ? $_SERVER['HTTP_FM_ORIGIN'] : null;
        if (!$this->_db =  apcu_fetch($this->config['server'] . '_db')) {
            $this->_db = $this->config['db'];
            apcu_store($this->config['server'] . '_db', $this->_db);
        }
    }
    private function response($resp)
    {
        ob_start();
        header('Content-type: application/json');
        if (isset($resp['e'])) {
            http_response_code($resp['e']);
            echo json_encode($resp['r']);
        } else echo json_encode($resp);
        header('Connection: close');
        header('Content-Length: ' . ob_get_length());
        ob_end_flush();
        ob_flush();
        flush();
        // flushing allows email send after response
    }
    private function debug($message, $req = false, $max = 250)
    {
        if (isset($message['password'])) $message['password'] = '...';
        if (is_array($message)) foreach ($message as $k => $v) {
            if (isset($message[$k]['password'])) $message[$k]['password'] = '...';
            if (isset($message[$k]['password_confirm'])) $message[$k]['password_confirm'] = '...';
        }
        $json = json_encode($message);
        if (strlen($json) > $max) {
            $short = [];
            if (is_array($message)) foreach ($message as $key => $val) {
                $len = strlen(json_encode($val));
                if ($len > $max) $short[$key] = "...($len)";
                else $short[$key] = $val;
            }
            else $j = substr($json, 10) . "...(" . strlen($json) . ")";
            $json = isset($j) ? $j : json_encode($short);
        }
        $msec = round($this->start - floor($this->start), 4);
        $id = $this->token ? $this->token['id'] . ($this->token['remember'] ? '+,' : ',') : '';
        if (!$id && isset($message['user']['id'])) $id = $message['user']['id'] . ',';
        //if (isset($message['req']) && $message['req']=='refresh') /*do nothing*/;
        error_log(($req ? $id : number_format(round(microtime(true) - $this->start, 4), 4) . ',' . $id) . $json . ',' . $msec);
    }
    private function mail($m)
    {
        if (!$this->mailer) {
            require_once 'mailer.php';
            $this->mailer = new Mailer($this->config['mail']);
        }
        $m['user'] = $this->user();
        $this->mailer->send($m);
    }
    private function db($query, $vals = [], $close = false)
    {
        $ret = null;
        if (!$this->con && $query != 'close') {
            if ($this->con = new mysqli('localhost', $this->_db['user'], $this->_db['password'], $this->_db['db'])) {
                mysqli_set_charset($this->con, "utf8");
            }
        }
        if ($query == 'close') $close = true;
        else if ($this->con && $query && count($vals) > 0) {
            if ($stmt = $this->con->prepare($query)) {
                call_user_func_array(array($stmt, 'bind_param'), $vals);
                $stmt->execute();
                if (substr($query, 0, 6) === 'insert') $ret = mysqli_insert_id($this->con);
                else if (substr($query, 0, 6) === 'update' || substr($query, 0, 6) === 'delete') $ret = mysqli_affected_rows($this->con);
                else $ret = mysqli_fetch_all($stmt->get_result(), MYSQLI_ASSOC);
                $stmt->close();
            } else $this->debug(['db' => 'Error', 'query' => $query, 'vals' => $vals]);
        } else if ($this->con && $query) {
            $res = $this->con->query($query);
            if (substr($query, 0, 8) === 'truncate' || substr($query, 0, 6) === 'delete' || substr($query, 0, 5) === 'alter') $ret = mysqli_affected_rows($this->con);
            else if ($res) {
                $ret = mysqli_fetch_all($res, MYSQLI_ASSOC);
                mysqli_free_result($res);
            } else {
                $ret = null;
                $this->debug(['query' => $query, 'vals' => $vals, 'result' => $ret]);
            }
        }
        if ($this->con && $close) {
            mysqli_close($this->con);
            $this->con = null;
        }
        if (in_array('db', $this->config['debug'])) $this->debug(['query' => $query, 'vals' => $vals, 'result' => $ret], false, 500);
        return $ret;
    }
    private function unzip($zip)
    {
        if (!$zip) return $zip; // allow passing of null
        else return json_decode(gzuncompress(base64_decode($zip)), true);
    }
    private function zip($json)
    {
        return base64_encode(gzcompress(json_encode($json)));
    }
    private function decrypt($payload, $unserialize = true)
    {
        if ($payload) {
            $payload = json_decode(base64_decode($payload), true);
            if (!$payload) return null;
            $iv = base64_decode($payload['iv']);
            $decrypted = openssl_decrypt($payload['value'], 'AES-256-CBC', $this->config['key'], 0, $iv);
            return $unserialize ? unserialize($decrypted) : $decrypted;
        } else return null;
    }
    public function encrypt($value, $serialize = true)
    {
        $iv = random_bytes(openssl_cipher_iv_length('AES-256-CBC'));
        $value = openssl_encrypt($serialize ? serialize($value) : $value, 'AES-256-CBC', $this->config['key'], 0, $iv);
        $iv = base64_encode($iv);
        //$mac = hash_hmac('sha256', $iv . $value, $this->config['key']);
        $json = json_encode(compact('iv', 'value'));
        //$this->debug(['encrypt'=>$json?true:false,'iv'=>$iv?true:false,'value'=>$value?true:false,'mac'=>$mac?true:false]);
        return base64_encode($json);
    }
}
