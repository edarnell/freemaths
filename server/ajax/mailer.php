<?php
require_once '../vendor/autoload.php';
class Mailer
{
  private $mailer, $transport, $template;
  function send($m)
  {
    $url = (isset($_SERVER['HTTP_FM_ORIGIN']) ? $_SERVER['HTTP_FM_ORIGIN'] : 'https://freemaths.uk');
    $user = $m['user'];
    switch ($m['type']) {
      case 'booking':
        $to = null;
        $from = $user;
        $message = $m['name'] . ($m['booking'] ? ' ' . $m['booking']['day'] . ' ' . $m['booking']['time'] . (isset($m['booking']['skip']) ? ' skip' : '') : ' cancel');
        $title = "FreeMaths Booking";
        $button = ['title' => 'FreeMaths.uk', 'url' => $url, 'text' => "FreeMaths.uk"];
        break;
      case 'error':
        $to = null;
        $from = $user;
        $message = 'Error logged: ' . $m['lid'];
        $title = "FreeMaths ERROR";
        $button = ['title' => 'FreeMaths.uk', 'url' => $url, 'text' => "FreeMaths.uk"];
        break;
      case 'test':
        $to = $m['mail']['to'];
        $from = isset($m['mail']['from']) ? $m['mail']['from'] : $user;
        $message = 'I have set at test for you. To take the test visit FreeMaths.uk and click on the Test button.';
        $title = "Message from " . $from['name'];
        $button = ['title' => 'FreeMaths.uk', 'url' => $url . '#tests', 'text' => "visit FreeMaths.uk"];
        break;
      case 'contact':
        $to = isset($m['mail']['to']) ? $m['mail']['to'] : null;
        $from = isset($m['mail']['from']) ? $m['mail']['from'] : $user;
        $re = isset($m['mail']['re']) && isset($m['mail']['re']['title']) ? 'Re: ' . $m['mail']['re']['title'] : null;
        $message = $m['mail']['message'];
        $title = "Message from " . $from['name'];
        $url .= "?mail=M{$m['lid']}_{$m['token']}";
        $button = ['title' => 'View on FreeMaths.uk', 'url' => $url, 'text' => "to see formatted maths and reply"];
        break;
      case 'newEmail':
        $to = $user;
        $message = "Please confirm your new email address.";
        $title = "Confirm Email";
        $url .= "?mail=E{$user['id']}_{$m['token']}";
        $button = ['title' => $title, 'url' => $url, 'text' => "confirm your new email"];
        break;
      case 'reset':
        $to = $user;
        $message = "You are receiving this email because a forgotten password request was made for your account.";
        $title = "Reset Password";
        $url .= "?mail=P{$user['id']}_{$m['token']}";
        $button = ['title' => $title, 'url' => $url, 'text' => "link will expire in 48 hours"];
        break;
      case 'register':
        $to = $user;
        $message = "Thank you for registering with FreeMaths.uk, use the button below to confirm and set your password.";
        $title = "Set Password";
        $url .= "?mail=R{$user['id']}_{$m['token']}";
        $button = ['title' => $title, 'url' => $url, 'text' => "link will expire in 48 hours"];
        break;
      case 'unsubscribe':
        $to = $user;
        $message = "Your account has now been unsubscribed and your details removed from our database."
          . PHP_EOL . "If you did not request this, or made the request in error please contact us or reply to this email.";
        $title = "Account Deleted";
        $url .= "?mail=X{$user['id']}_{$m['token']}";
        $button = ['title' => "Contact Us", 'url' => $url, 'text' => "contact FreeMaths.uk"];
        break;
    }
    $greet = $to ? "Dear {$to['name']}," : '';
    $re = isset($re) ? $re : '';
    $html = str_replace(['$greet', '$title', '$re', '$message', '$button.title', '$button.url', '$button.text'], [$greet, $title, $re, nl2br(htmlentities($message)), $button['title'], $button['url'], $button['text']], $this->template);
    $text = '*** ' . $title . " ***" . PHP_EOL . $greet . PHP_EOL . $message . PHP_EOL . $button['title'] . ' (' . $button['text'] . '): ' . $button['url'] . PHP_EOL;
    // Create a message
    $email = (new Swift_Message($title))
      ->setFrom(['ed.darnell@freemaths.uk' => 'FreeMaths.uk'])
      ->setBcc(['epdarnell@gmail.com' => 'Ed Darnell'])
      ->setTo($to ? [$to['email'] => $to['name']] : ['ed.darnell@freemaths.uk' => 'FreeMaths.uk'])
      ->setBody($html, 'text/html')
      ->addPart($text, 'text/plain');
    if (isset($from) && $from) $email->setReplyTo([$from['email'] => $from['name']]);
    // Send the message
    /*
    if (strncmp($message, '_test', 5) == 0 || strncmp($message, "'_test", 6) == 0) {
      $test = strpos($message, ' ') > 0 ? substr($message, 0, strpos($message, ' ')) : $message;
      file_put_contents("../storage/emails/{$test}", json_encode(['to' => $to, 'from' => isset($from) ? $from : null, 'token' => $m['token'], 'greet' => $greet, 'title' => $title, 'button' => $button, 'message' => $message]));
    } else if (strncmp($to['email'], 'epdarnell+', strlen('epdarnell+')) == 0) {
      file_put_contents("../storage/emails/{$m['type']}_{$to['email']}", json_encode(['to' => $to, 'from' => isset($from) ? $from : null, 'token' => $m['token'], 'greet' => $greet, 'title' => $title, 'button' => $button, 'message' => $message]));
    }
    */
    if ($this->mailer) $this->mailer->send($email);
    // else could save copy
  }
  function __construct($config)
  {
    // Create the Transport
    if ($config['server'] == '') {
      $this->transport = null;
    } else if ($config['server'] == 'localhost') {
      $this->transport = new Swift_SendmailTransport('/usr/sbin/sendmail -bs');
    } else {
      $this->transport = (new Swift_SmtpTransport($config['server'], $config['port'], 'ssl'))
        ->setUsername($config['user'])
        ->setPassword($config['password']);
      // Create the Mailer using your created Transport
    }
    $this->mailer = $this->transport ? new Swift_Mailer($this->transport) : null;
    $this->template =
      '<html>
<head>
<meta http-equiv="Content-Type" content="text/html; " />
<meta http-equiv="Content-Language" content="en-GB" />
<meta name="language" content="en-GB" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="HandheldFriendly" content="true" />
<title>$title</title>
</head>
<body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" bgcolor="#fbfbfb" id="ft_email">
<table id="outer_tabler" width="100%" cellpadding="5" cellspacing="0" bgcolor="#fbfbfb">
<tr>
<td valign="top" align="center">
<table class="full" id="inner_table" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td height="60" valign="middle" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-top:1px solid #e6dee4;border-right:1px solid #e6dee4;border-left:1px solid #e6dee4;font-size:30px;font-family:Georgia,serif;">
<a href="" style="color:#3097D1;text-decoration:none;">FreeMaths.uk</a>
</td>
</tr>
<tr>
<td valign="top" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #e6dee4;border-right:1px solid #e6dee4;">
<hr style="height:1px;margin:0 auto;background:#3097D1;padding:0;border:0;width:90%;" />
<table class="full" id="content" width="90%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
<tr>
<td bgcolor="#ffffff" valign="top" width="100%" style="font-size:16px;color:#000000;line-height:150%;font-family:Arial,sans-serif;text-align:justify;">
<h3 name="greet">$greet</h3>
<center><h3 name="title">$title</h3>
<div name="message" style="margin:0; padding:0; text-align:left;">$re</div>
<div style="background:#f5f8fa;padding-top:10px; padding-right: 15px; padding-bottom:10px; padding-left: 15px; margin-bottom: 15px;">
<div name="message" style="margin:0; padding:0; text-align:left;">
$message
</div></div>
<table width="100%" cellpadding="0" cellspacing="0" class="button-wrapper large method-padding-border">
<tr>
<td align="center" width="100%">
<table width="auto" cellpadding="0" cellspacing="0">
<tr>
<td align="center" width="auto" bgcolor="#3097D1" style="background: #3097D1; -webkit-border-radius: 6px; -moz-border-radius: 6px; border-radius: 6px; color: #ffffff; font-weight: bold; text-decoration: none; font-size: 18px; font-family: Helvetica, Arial, sans-serif; display: block;" class="button_td">
<a name="button" href="$button.url" title="$button.title" style="color: #ffffff; text-decoration: none; padding-top: 10px; padding-right: 25px; padding-bottom: 10px; padding-left: 25px; -webkit-border-radius: 6px; -moz-border-radius: 6px; border-radius: 6px; border: 1px solid #3097D1; display: inline-block;" class="button">
$button.title</a></td>
</tr>
</table>
</tr>
</table>
<div class="padded">
<p style="margin: 0; padding: 0; line-height:1.6em; color:#999;"><small><em name="button_text">$button.text</em></small></p><br />
</div>
</center>
</td>
</tr>
</table>
<hr style="height:1px;margin:0 auto;padding:0;background:#3097D1;border:0;width:90%;" />
</td>
</tr>
<tr>
<td height="60" valign="middle" align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-left:1px solid #e6dee4;border-right:1px solid #e6dee4;border-bottom:1px solid #e6dee4;padding:5px 0;">
<span style="font-size:14px;color:#999;line-height:20px;font-family:Arial,sans-serif;">
Copyright &copy; 2019 FreeMaths Ltd. All rights reserved.
</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>';
  }
}
